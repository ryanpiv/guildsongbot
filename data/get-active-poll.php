<?php
header('Content-Type: application/json');

$username = "disappointedsong";
$password = "Ry7T0qQ~10R-";
$hostname = "mysql4.gear.host";
$db = "disappointedsong";
$con = mysqli_connect($hostname, $username, $password, $db);

//$index = $_GET['index'];

//query to get next game in list
$sql = "SELECT * FROM polls where dateEnd > NOW()";
//LIMIT " . $index . ", 1";
$result = $con->query($sql);

try {
	if (!$result) {
		print_r("Error: " . $sql . "<br>" . $con->error);
	} else {
		$json = mysqli_fetch_all($result, MYSQLI_ASSOC);
		echo json_encode($json);
	}
} catch (Exception $e) {
	die($e);
}

?>