<?php
//Include database configuration file
//include('dbConfig.php');
//if(isset($_POST["inputlevel"]){
//	$result = $conn->query("SELECT llevel,rlevel FROM inputlevel");		     
//	while ($row = mysqli_fetch_array($result)) {
//		$llevel = $row['llevel'];
//		$rlevel = $row['rlevel'];
//	}
//	$conn->close();
//	echo '<script type="text/javascript">';
//	echo 'var lelem = document.getElementById("llevel");';
//	echo 'var relem = document.getElementById("rlevel");';
//	echo "lelem.style.width = 10 + '%';";
//	echo "relem.style.width = 10 + '%';";
//	echo '</script>';

//}
include('dbConfig.php');
function getStreamdestaddr($streamID='1'){
	return ("SELECT destaddr FROM stream WHERE id=".$streamID);
}

if(isset($_POST["inputlevel"]) && !empty($_POST["inputlevel"])){
	$result = $conn->query("SELECT inputlevel.llevel,inputlevel.rlevel,network.uplink, network.downlink FROM inputlevel ,network");	
	$conn->close();
	while ($row = mysqli_fetch_array($result)) {
		$llevel = $row['llevel']*10;
		$rlevel = $row['rlevel']*10;
	echo '<script type="text/javascript">';
	echo 'var lelem = document.getElementById("llevel");';
	echo 'var relem = document.getElementById("rlevel");';
	echo "lelem.style.width = ".$llevel." + '%';";
	echo "relem.style.width = ".$rlevel." + '%';";
	echo 'var uplink = document.getElementById("uplink");';
	echo 'var downlink = document.getElementById("downlink");';
	echo 'uplink.value = "'. $row['uplink'] . 'kbps";';
	echo 'downlink.value = "'. $row['downlink'] . 'kbps";';
	echo '</script>';
	}
	
}
?>