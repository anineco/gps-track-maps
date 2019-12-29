<?php
require_once '../../../init.php';
$cf = set_init();

function deg($s) {
  preg_match('/^(\d+)(\d\d)(\d\d)$/', $s, $m);
  return sprintf('%.6f', $m[1] + $m[2] / 60 + $m[3] / 3600);
}

$dbh = new PDO(
  "mysql:unix_socket=$cf[socket];dbname=$cf[database];charset=utf8mb4",
  "$cf[user]",
  "$cf[password]"
);

$type = !empty($_POST) ? INPUT_POST : INPUT_GET;
$mode = 'end';
$val = null;
foreach (array('cat', 'id', 'rec', 'q') as $i) {
  $val = filter_input($type, $i);
  if (isset($val)) {
    $mode = $i;
    break;
  }
}

#
# 総称名
#
$g_kana = array();
$g_name = array();
$sth = $dbh->prepare('SELECT id,kana,name FROM sanmei WHERE type=0');
$sth->execute();
while ($row = $sth->fetch(PDO::FETCH_OBJ)) {
  $g_kana[$row->id] = $row->kana;
  $g_name[$row->id] = $row->name;
}
$sth = null;

if ($mode === 'cat') {
#
# GeoJSON出力
#
  $v = filter_input($type, 'v');
  if ($val == 0) {
    if ($v == 0) {
      $sql = <<<'EOS'
SELECT id,name AS n,lat,lon,1 AS c
FROM geo
WHERE act>0
EOS;
    } else if ($v == 1) {
      $sql = <<<'EOS'
SELECT id,name AS n,lat,lon,1 AS c
FROM geo
JOIN (
  SELECT DISTINCT id
  FROM explored
  LEFT JOIN record USING (start)
  WHERE link IS NOT NULL
) AS e USING (id)
EOS;
    } else {
      $sql = <<<'EOS'
SELECT id,name AS n,lat,lon,c
FROM geo
LEFT JOIN (
  SELECT id,count(start) AS c
  FROM (
    SELECT id,start
    FROM explored
    LEFT JOIN record USING (start)
    WHERE link IS NOT NULL
  ) AS e
  GROUP BY id
) AS t USING (id)
WHERE act>0
EOS;
    }
  } else {
    if ($v == 0) {
      $sql = <<<'EOS'
SELECT id,meizan.name AS n,lat,lon,1 AS c
FROM geo
JOIN meizan USING (id)
WHERE cat=?
EOS;
    } else if ($v == 1) {
      $sql = <<<'EOS'
SELECT id,n,lat,lon,1 AS c
FROM (
  SELECT id,meizan.name as n,lat,lon
  FROM geo
  JOIN meizan USING (id)
  WHERE cat=?
) AS g
JOIN (
  SELECT DISTINCT id
  FROM explored
  LEFT JOIN record USING (start)
  WHERE link IS NOT NULL
) AS e USING (id)
EOS;
    } else {
      $sql = <<<'EOS'
SELECT id,n,lat,lon,c
FROM (
  SELECT id,meizan.name as n,lat,lon
  FROM geo
  JOIN meizan USING (id)
  WHERE cat=?
) AS g LEFT JOIN (
  SELECT id,count(start) AS c
  FROM (
    SELECT id,start
    FROM explored
    LEFT JOIN record USING (start)
    WHERE link IS NOT NULL
  ) AS e
  GROUP BY id
) AS t USING (id)
EOS;
    }
  }
  $sth = $dbh->prepare($sql);
  if ($val > 0) {
    $sth->bindValue(1, $val);
  }
  $sth->execute();
  header('Content-type: application/geo+json');
  echo '{"type":"FeatureCollection","features":[', PHP_EOL;
  $count = 0;
  while ($row = $sth->fetch(PDO::FETCH_OBJ)) {
    if ($count > 0) {
      echo ',', PHP_EOL;
    }
    $id = $row->id;
    $name = $row->n;
    if ($val == 0 && isset($g_name[$id])) {
      $name = $g_name[$id] . '・' . $name;
    }
    $lat = deg($row->lat);
    $lon = deg($row->lon);
    $c = $row->c;
    echo <<<EOS
{"id":"$id","type":"Feature","properties":{"name":"$name","c":"$c"},
"geometry":{"type":"Point","coordinates":[$lon,$lat]}}
EOS;
    $count++;
  }
  $sth = null;
  echo PHP_EOL, ']}', PHP_EOL;
} elseif ($mode != 'end') {
#
# JSON出力
#
  $c = filter_input($type, 'c');
  $geo = array();
  $rec = array();
  if ($mode === 'rec' && $c > 0) {
    $sql = <<<'EOS'
SELECT id,meizan.kana,meizan.name,alt,lat,lon,auth,note
FROM geo
JOIN meizan USING(id)
WHERE id=? AND cat=?
EOS;
  } elseif ($mode === 'id' || $mode === 'rec' || preg_match('/^[0-9]+$/', $val)) {
    $sql = <<<'EOS'
SELECT id,kana,name,alt,lat,lon,auth,note
FROM geo
WHERE act>0
EOS;
    $sql .= $val ? ' AND id=?' : ' ORDER BY id DESC LIMIT 1';
  } else {
    $sql = <<<'EOS'
SELECT DISTINCT id,geo.kana,geo.name,alt,lat,lon,auth,note
FROM geo JOIN sanmei USING(id)
WHERE act>0 AND
EOS;
    if (substr($val, 0, 1) === '%' || substr($val, -1, 1) === '%') {
      $sql .= ' sanmei.name LIKE ?';
    } else {
      $sql .= ' sanmei.name=?';
    }
    $sql .= ' ORDER BY alt DESC LIMIT 400';
  }
  $sth = $dbh->prepare($sql);
  if ($val) {
    $sth->bindValue(1, $val);
    if ($mode === 'rec' && $c > 0) {
      $sth->bindValue(2, $c);
    }
  }
  $sth->execute();
  while ($row = $sth->fetch(PDO::FETCH_OBJ)) {
    $id = $row->id;
    $name = $row->name;
    $kana = $row->kana;
    if (!($mode === 'rec' && $c > 0) && isset($g_name[$id])) {
      $name = $g_name[$id] . '・' . $name;
      $kana = $g_kana[$id] . '・' . $kana;
    }
    $geo[] = array(
      'id' => $id,
      'kana' => $kana,
      'name' => $name,
      'alt' => $row->alt,
      'lat' => $row->lat,
      'lon' => $row->lon,
      'auth' => $row->auth,
      'note' => $row->note
    );
  }
  $sth = null;
  if ($mode === 'id') {
    $alias = array();
    $sql = <<<'EOS'
SELECT kana,name
FROM sanmei
WHERE id=? AND type>1
EOS;
    $sth = $dbh->prepare($sql);
    $sth->bindValue(1, $val);
    $sth->execute();
    while ($row = $sth->fetch(PDO::FETCH_OBJ)) {
      $alias[] = array('kana' => $row->kana, 'name' => $row->name);
    }
    $sth = null;
    $geo[0]['alias'] = $alias;
  } elseif ($mode === 'rec') {
    $sql = <<<'EOS'
SELECT summit,link,start,end,title,summary,image
FROM record
NATURAL JOIN explored
WHERE id=? AND link IS NOT NULL
EOS;
    $sth = $dbh->prepare($sql);
    $sth->bindValue(1, $val);
    $sth->execute();
    while ($row = $sth->fetch(PDO::FETCH_OBJ)) {
      $rec[] = array(
        'summit' => $row->summit,
        'link' => $row->link,
        'start' => $row->start,
        'end' => $row->end,
        'title' => $row->title,
        'summary' => $row->summary,
        'image' => $row->image
      );
    }
    $sth = null;
  }
  $output = array('geo' => $geo, 'rec' => $rec);
  header('Content-type: application/json');
  echo json_encode($output, JSON_UNESCAPED_UNICODE), PHP_EOL;
}
$dbh = null;
