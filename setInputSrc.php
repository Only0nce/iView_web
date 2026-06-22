<?php
//Include database configuration file
include('dbConfig.php');

if(isset($_POST["sourceID"]) && !empty($_POST["sourceID"])){
    $sql = "UPDATE inputsrc SET srcselected = 0";
  	$conn->query($sql);
	$sql = "UPDATE inputsrc SET srcselected = 1 WHERE id=".$_POST['sourceID'];
	$conn->query($sql);
	$sql = "UPDATE webcommand SET inputchange = 1, volume = 1";
	$conn->query($sql);
	$result = $conn->query("SELECT id,source, srcselected, volume FROM inputsrc");		     
	while ($row = mysqli_fetch_array($result)) {
		if ($row['srcselected'] == '1')
			echo "<option class='selectedlt' selected value='" . $row['id'] . "'>" . $row['source'] . " (Selected)</option>";
		else 
			echo "<option class='selectedlt' value='" . $row['id'] . "'>" . $row['source'] . "</option>";
	}
	$conn->close();
}
?>