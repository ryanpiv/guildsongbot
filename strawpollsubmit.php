<?php

$url = 'https://strawpoll.me/api/v2/polls';

$options = Array();
foreach ($_POST as $key => $value) {
	array_push($options, $value);
}
print_r($options);

$headers[] = $options;
$headers[] = "'multi': false";

$ch = curl_init();
curl_setopt_array($ch, array(
	CURLOPT_URL => $url,
	CURLOPT_HTTPHEADER => array($headers),
	CURLOPT_RETURNTRANSFER => 1,
	CURLOPT_FOLLOWLOCATION => 1,
	CURLOPT_VERBOSE => 1,
	CURLOPT_SSL_VERIFYPEER => 0,
));
$response = curl_exec($ch);

if (!curl_exec($ch)) {
	print_r('Error: "' . curl_error($ch) . '" - Code: ' . curl_errno($ch));
} else {
	print_r($response);
}
curl_close($ch);

?>