<?php
//Include database configuration file
include('dbConfig.php');
function getStreamdestaddr($streamID='1'){
	return ("SELECT protocol, portaddr, rtspportaddr FROM stream WHERE id=".$streamID);
}

if(isset($_POST["testID"]) && !empty($_POST["testID"])){
    $query = $conn->query(getStreamdestaddr($_POST["testID"]));
    $rowCount = $query->num_rows;
    if($rowCount > 0){
        while($row = $query->fetch_assoc()){ 
			if ($row['protocol'] != 'RTSP'){
				echo '<script type="text/javascript">';
				echo 'var a = document.getElementById("portdestaddr");';
				echo 'a.value = "'. $row['portaddr'] . '";';
				echo '</script>';
			}
			else if ($row['protocol'] == 'RTSP'){
				echo '<script type="text/javascript">';
				echo 'var a = document.getElementById("portdestaddr");';
				echo 'a.value = "'. $row['rtspportaddr'] . '";';
				echo '</script>';
			}
        }
    }
	$conn->close();
}
?>