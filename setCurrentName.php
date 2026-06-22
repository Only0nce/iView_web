<?php
//Include database configuration file
include('dbConfig.php');
function getStreamName($streamID='1'){
	return ("SELECT name FROM stream WHERE id=".$streamID);
}

if(isset($_POST["testID"]) && !empty($_POST["testID"])){
    $query = $conn->query(getStreamName($_POST["testID"]));
    $rowCount = $query->num_rows;
    if($rowCount > 0){
        while($row = $query->fetch_assoc()){ 
			echo '<script type="text/javascript">';
  			echo 'var a = document.getElementById("currentName");';
			echo 'a.value = "'. $row['name'] . '";';
			echo '</script>';
        }
    }
	$conn->close();
}
?>