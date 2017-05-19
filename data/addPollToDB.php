<?php

$username = "disappointedsong";
$password = "Ry7T0qQ~10R-";
$hostname = "mysql4.gear.host";
$db = "disappointedsong";
$con = mysqli_connect($hostname, $username, $password, $db);

$id = $_GET['id'];

$sql = "INSERT INTO polls (strawpollid, dateStart, dateEnd) VALUES(" . $id . ", Now(), DATE_ADD(Now(),INTERVAL 1 WEEK))";
$result = $con->query($sql);

if (!$result) {
	print_r("Error: " . $sql . "<br>" . $con->error);
} else {
	print_r($result);
}

?>