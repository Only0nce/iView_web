<?php
	session_start();
	if($_SESSION['UserID'] == "")
	{
		echo("<script>location.href = '/login.php';</script>");
	}

	if($_SESSION['Status'] != "ADMIN")
	{
		echo("<script>location.href = '/login.php';</script>");
	}	
?>
<!DOCTYPE HTML>
<?php
include('dbConfig.php');
include('ListAudioGain.php');
$strSQL = "SELECT deviceName FROM member";
$objQuery = mysqli_query($conn,$strSQL);
if (!$objQuery) {
    printf("Error: %s\n", $conn->error);
    exit();
}
$objResult = mysqli_fetch_array($objQuery);
if(!$objResult)
{
	mysqli_close($conn);
	echo("<script>location.href = '/changepass.php';</script>");
}
else
{	
	$deviceName = $objResult["deviceName"];
}
mysqli_close($conn);
echo '<html>';
echo '<head>';
echo '<title>'.$deviceName.'</title>';
?>
  <meta name="description" content="4 Wire to ED-137 Converter" />
  <meta name="keywords" content="ED137, SIP" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="styleServer.css" title="style" />
  <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="myfunctionControler.js"></script>
  <script type = "text/javascript">
	  
  </script>
</head>

<body>
<div id="header">
  <div id="logo">
	<div id="logo_text">
      <!-- class="logo_colour", allows you to change the colour of the text -->
      <?php	echo '<h1><a href="index.php"><span class="logo_colour">'.$deviceName.'</span></a></h1>'?>
      <!--          <h2>IFZ Technologies Co.,Ltd.</h2>-->
    </div>
  </div>
  <div id="menubar">
	<ul id="menu">
		<li><a href="index.php">MONITOR</a></li>
		<li><a href="ctrlinfo.php">CTRL INFO</a></li>
		<li class="selected"><a href="controler.php">CONTROLERS</a></li>
		<li><a href="channel.php">CHANNELS</a></li>
		<li><a href="radio.php">RADIOS</a></li>
		<li><a href="network.php">NETWORK</a></li>
		<li><a href="update.php">SYSTEM</a></li>
		<li><a href="logout.php">LOGOUT</a></li>
		<li><a href="changepass.php">CHANGE PASSWORD</a></li>
	</ul>
  </div>
</div>

<div class="center">
<div class="site_content">	
<?php
	echo '<div class="conttrlDiv">';
    echo  '<input type="text" id="ctrlID" value="ID"  disabled/>';
    echo  '<input type="text" value="URI" disabled/>';
    echo  '<input type="text" value="SIP Port" disabled/>';
    echo  '<input type="text" value="RPT Start" disabled/>';
	echo  '<input type="text" value="Keep Alive Peroid" disabled/>';
	echo  '<input type="text" value="CHANNEL" style="visibility:hidden" disabled/>';
	echo '</div>';
	
	$conn = mysqli_connect($dbHost,$dbUsername,$dbPassword,$dbName);

	$strSQL = "SELECT * FROM controler";
	$objQuery = mysqli_query($conn,$strSQL);
	if (!$objQuery) {
			printf("Error: %s\n", $conn->error);
			exit();
	}


	if ($objQuery->num_rows > 0) 
	{
		while($row = $objQuery->fetch_assoc()) 
		{
			echo '<div class="conttrlDiv">';
				echo '<input type="text" disabled name="ctrlID'.$row["id"].'" id="ctrlID'.$row["id"].'" value="'.$row["id"].'"/>';
				echo '<input type="text" minlength="1" maxlength="8" pattern="[A-Za-z0-9]+ placeholder="URI"  name="ctrlURI'.$row["id"].'" id="ctrlURI'.$row["id"].'" value="'.$row["sipUser"].'"/>';
				echo '<input type="number" placeholder="SIP Port"   min="0" max="65535" name="sipPort'.$row["id"].'" id="sipPort'.$row["id"].'" value="'.$row["sipPort"].'"/>';
				echo '<input type="number" placeholder="RTP Start"   min="0" max="65535" name="rtpStartPort'.$row["id"].'" id="rtpStartPort'.$row["id"].'" value="'.$row["rtpStartPort"].'"/>';
				echo '<input type="number" placeholder="RTP Start"   min="200" max="1000" name="keepAlivePeroid'.$row["id"].'" id="keepAlivePeroid'.$row["id"].'" value="'.$row["keepAlivePeroid"].'"/>';
				echo '<button type="submit" onClick="updateControler('.$row["id"].')" ;>UPDATE</button>';
				
			echo '</div>';
		}
	} 
	else 
	{
		echo "No Controler List";
	}
	mysqli_close($conn);

?>
</div>

<div id="footer">
      IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.
</div>
</body>
</html>
