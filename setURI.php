<?php
//Include database configuration file
include('dbConfig.php');
function getStreamdestaddr($streamID='1'){
	return ("SELECT protocol, uri FROM stream WHERE id=".$streamID);
}

if(isset($_POST["testID"]) && !empty($_POST["testID"])){
    $query = $conn->query(getStreamdestaddr($_POST["testID"]));
    $rowCount = $query->num_rows;
    if($rowCount > 0){
        while($row = $query->fetch_assoc()){ 
			if (($row['protocol'] == 'RTSP') or ($row['protocol'] == 'HTTP')){
				echo '<script type="text/javascript">';
				echo 'var a = document.getElementById("uriaddr");';
				echo 'a.value = "'. $row['uri'] . '";';
				echo '</script>';
			}
			else {
				echo '<script type="text/javascript">';
				echo 'var a = document.getElementById("uriaddr");';
				echo 'a.value = "None";';
				echo '</script>';
			}
        }
    }
	$conn->close();
}
?>