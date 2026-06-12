<?php
//Include database configuration file
include('dbConfig.php');

if(isset($_POST["volumeLevel"])){
	$sql = "UPDATE inputsrc SET volume=".$_POST['volumeLevel']." WHERE srcselected = 1";
	$conn->query($sql);
	$sql = "UPDATE webcommand SET volume = 1";
	$conn->query($sql);
	$conn->close();
}
?>