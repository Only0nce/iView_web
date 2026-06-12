<?php
	$serverName = "localhost";
	$userName = "userData";
	$userPassword = "Ifz8zean6969**";
	$dbName = "RFPowerMonitors";
	//Connect and select the database
	$conn = new mysqli($serverName,$userName,$userPassword,$dbName);

	if ($conn->connect_error) {
	    die("Connection failed: " . $conn->connect_error);
	}
?>
