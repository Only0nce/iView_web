<?php
//Include database configuration file
include('dbConfig.php');
function getStreamdestaddr($streamID='1'){
	return ("SELECT destaddr FROM stream WHERE id=".$streamID);
}

if(isset($_POST["testID"]) && !empty($_POST["testID"])){
    $query = $conn->query(getStreamdestaddr($_POST["testID"]));
    $rowCount = $query->num_rows;
    if($rowCount > 0){
        while($row = $query->fetch_assoc()){ 
			echo '<script type="text/javascript">';
  			echo 'var a = document.getElementById("ipdestaddr");';
			echo 'a.value = "'. $row['destaddr'] . '";';
			echo '</script>';
        }
    }
}
?>