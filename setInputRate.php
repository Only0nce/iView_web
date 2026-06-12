<?php
//Include database configuration file
include('dbConfig.php');

if(isset($_POST["inputrateID"]) && !empty($_POST["inputrateID"])){
    $sql = "UPDATE samplerate SET inputrate = 0";
  	$conn->query($sql);
	$sql = "UPDATE samplerate SET inputrate = 1 WHERE id=".$_POST['inputrateID'];
	$conn->query($sql);
	$sql = "UPDATE webcommand SET inputrate = 1";
	$conn->query($sql);
	$result = $conn->query("SELECT id,samplerate, ssamplerate, inputrate FROM samplerate WHERE hwsupport=1");		     
	while ($row = mysqli_fetch_array($result)) {
		if ($row['inputrate'] == '1')
			echo "<option class='selectedlt' selected value='" . $row['id'] . "'>" . $row['ssamplerate'] . " (Selected)</option>";
		else 
			echo "<option class='selectedlt' value='" . $row['id'] . "'>" . $row['ssamplerate'] . "</option>";
	}
	$conn->close();
}
?>