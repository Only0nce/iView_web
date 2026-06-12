<?php
//Include database configuration file
include('dbConfig.php');
function getStreamdestaddr($streamID='1'){
	return ("SELECT protocol, uri FROM stream WHERE id=".$streamID);
}

if(isset($_POST["update"]) && !empty($_POST["update"])){
    $profileid = $_POST['profilelist'];
	$profileName = $_POST['currentName'];
	$protocolID = $_POST['outputprotocol'];
	$portdestaddr = $_POST['portdestaddr'];
	$ipdestaddr = $_POST['ipdestaddr'];
	$uriaddr = $_POST['uriaddr'];
	$outputcodecsID = $_POST['audioformatlist'];
	$audioSampleRateID = $_POST['audiosamplerate'];
	$audioBitrateID = $_POST['audioBitrates'];
	$audioformatID = $_POST['audioformat'];

	$result = $conn->query(getAudioTypeByID($outputcodecsID));
	$row = mysqli_fetch_array($result);
	$acodec = $row['type'];

	$result = $conn->query(getProtocolByID($protocolID));
	$row = mysqli_fetch_array($result);
	$protocol = $row['streamprotocol'];

	$result = $conn->query(getSamplerateByID($audioSampleRateID));
	$row = mysqli_fetch_array($result);
	$samplerate = $row['samplerate'];

	$result = $conn->query(getBitrateByID($audioBitrateID));
	$row = mysqli_fetch_array($result);
	$audiobitrate = $row['bitrate'];

	if($outputcodecsID != $PCM){
	  $result = $conn->query("SELECT ".$protocol." AS acodecFormat, acodec FROM audioformat WHERE id=".$outputcodecsID);
	  $row = mysqli_fetch_array($result);
	  $acodecFormat = $row['acodecFormat'];
	  $audioformat = $row['acodec'];
	}else{
	  $result = $conn->query("SELECT format, aformat FROM pcmformat WHERE id=".$audioformatID);
	  $row = mysqli_fetch_array($result);
	  $audioformat = $row['format'];
	  if ($protocol == 'UDP'){
		  $acodecFormat = $row['aformat'];
	  }else if($protocol == 'RTP'){
		  $acodecFormat = 'rtp';
	  }else{
		  $acodecFormat = '';
	  }
	}
	$updatePort = 'portaddr';
	if ($protocol == 'RTSP'){
	 $updatePort = 'rtspportaddr'; 
	}

	if(($uriaddr == 'None') or ($uriaddr == "")){
	  if (($protocol == 'RTSP') or ($protocol == 'HTTP')){
		  $result = $conn->query("SELECT uri FROM audioformat WHERE id=".$outputcodecsID);
		  $row = mysqli_fetch_array($result);
		  $uriaddr = $row['uri'];
		  $ipdestaddr = "0.0.0.0";
	  }
	  else{
		  $uriaddr='None';
	  }
	}

	if (($protocol == 'RTSP') or ($protocol == 'HTTP')){
	  $ipdestaddr = "0.0.0.0";
	}else{
	  $uriaddr='None';
	}

	$sql = "UPDATE stream SET name='".$profileName."', protocol='".$protocol."', destaddr = '".$ipdestaddr."', ".$updatePort."='".$portdestaddr."', uri='".$uriaddr."', samplerate='".$samplerate."', bitrate='".$audiobitrate."', acodec='".$acodec."', aformat='".$acodecFormat."', libcodec='".$audioformat."' WHERE id=".$profileid;
	$conn->query($sql);
	$conn->close();
}
?>