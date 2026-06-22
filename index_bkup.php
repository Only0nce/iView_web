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
include('ListAudioGain.php')
?>
<html>
<head>
  <title>iView RF Power Monitor</title>
  <meta name="description" content="4 Wire to ED-137 Converter" />
  <meta name="keywords" content="ED137, SIP" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="style.css" title="style" />
  <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="myfunctionIndexServer.js"></script>
<!--  <script type="text/javascript" src="countUp.js"></script>-->
  
  <script type = "text/javascript">
	  
  </script>
</head>

<body>
<div id="header">
  <div id="logo">
	<div id="logo_text">
      <h1><a href="index.php"><span class="logo_colour">iView RF Power Monitor</span></a></h1>
    </div>
  </div>
<!--
  <div class="showHeaderDiv">
  	<h1 class="text-align-center">UHF Multi-coupler </h1>
  </div>
-->
  <div id="menubar">
	<ul id="menu">
		<li class="selected"><a href="index.php">HOME</a></li>
		<li><a href="datalogger.php">LOG</a></li>
		<li><a href="cal.php?id=1">CAL</a></li>
    <li><a href="thrulan.php?id=0">THRULAN</a></li>
    <li><a href="role.php?id=0">SITE</a></li>
		<li><a href="network.php">NETWORK</a></li>
		<li><a href="update.php">system</a></li>
		<li><a href="logout.php">LOGOUT</a></li>
		<li><a href="changepass.php">CHANGE PASS.</a></li>
	</ul>
  </div>
</div>
  <div id="site_content">
        
	<?php
	if(isset($_POST['system'])){    
	  $command = $_POST['systemcommamd'];
	  if ($command == '1'){
		  echo '<script language="javascript">';
		  echo "alert('Syetem will be reboot.')";
		  echo '</script>';
		  system("sudo reboot");
	  }
	  else if ($command == '2'){
		  echo '<script language="javascript">';
		  echo "alert('System shutting down. Goodbye.')";
		  echo '</script>';
		  system("sudo shutdown -h 0");
	  }
	  else if ($command == '3'){
		  echo '<script language="javascript">';
		  echo "alert('Restart ED-137 Converter Service')";
		  echo '</script>';
		  system("sudo /etc/init.d/ed137converterd stop > /dev/null 2>&1 &");
	  }
	}
	?>

<div class="container">
<h3 class="truelanLabel">iView RF Power Monitor</h3>
<button id="unitWattActive" name="unitWattActive" onclick="setUnit(false)" style="left: calc(100% - 80px); background-color: #009688FF;" class="w3-button w3-teal w3-large w3-padding-large">W</button>
<button id="unitDBActive" name="unitDBActive" onclick="setUnit(true)" style="left: calc(100% - 160px); background-color: #00968840;" class="w3-button w3-teal w3-large w3-padding-large">dBm</button>
</div>


<div class="container1" style="display: flex; flex-direction: column; flex-wrap: wrap; align-content: flex-start;">
	<?php
	for ($i=1; $i <= 4 ; $i++) { 
		echo '<div class="card" id="card'.$i.'" name="card'.$i.'" style="display: none; width:35%; ">';		

    echo '<h3 class="title" id="title'.$i.'" name="title'.$i.'">Card '.$i.'</h3>';
    echo '<h3 class="fwdLabel" id="fwdValue'.$i.'">0.00 W</h3>';
    echo '<span class="fwdpowerw" id="fwdUnit'.$i.'" name="fwdUnit'.$i.'"> Forward Power(W) </span>';
	  echo '  <div class="barfwd">';
    echo '  	<div class="emptybar"></div>';
    echo '  	<div class="filledbar" id="barFwdLevel'.$i.'" name="barFwdLevel'.$i.'" ></div>';
    echo '</div>';
    echo '<div class="divRwdVswr">';
    echo '	<h3 class="rwdLabel" id="rwdValue'.$i.'" name="rwdValue'.$i.'">0.00 W</h3>';
    echo '	<h3 class="vswrLabel" id="swrValue'.$i.'" name="swrValue'.$i.'">1.000 </h3>';
    echo '</div>';
    echo '<div class="divBarRwdVswr">';
    echo '	<div class="barrwd" id="barrwd">';
    echo '		<div class="emptybar"></div>';
    echo '  	<div class="filledbar" id="barRwdLevel'.$i.'" name="barRwdLevel'.$i.'" ></div>';
    echo '	</div>';
    echo '	<div class="barvswr" id="barvswr">';
    echo '		<div class="emptybar"></div>';
    echo '  	<div class="filledbar" id="barVswrLevel'.$i.'" name="barVswrLevel'.$i.'" ></div>';
    echo '	</div>';
    echo '</div>';
    echo '<div class="divRwdVswrLabel">';
    echo '	<span class="rwdpowerlabel" id="rwdUnit'.$i.'" name="rwdUnit'.$i.'"> Reward Power(W) </span>';
    echo '	<span class="vswrlabel"> VSWR </span>';
    echo '</div>';
    echo '<div class="cardDisconnect" id="cardDisconnect'.$i.'" name="cardDisconnect'.$i.'" style="display: block;">';
    echo '<img src="img/warning-icon.png" alt="warning" class="imgCenter">';
    echo '<span class="cardDisconnectLabel"> Not Connected </span>';
    echo '</div>';

  	echo '</div>';

    echo '<div class="cardRssi" id="card_uart'.$i.'" name="card_uart'.$i.'" style="display: none;">';   

    echo '<h3 class="title" id="title_uart'.$i.'" name="title_uart'.$i.'">RSSI</h3>';
    echo '<h3 class="fwdLabel" id="rssi'.$i.'">-130</h3>';
    echo '<span class="fwdpowerw" id="fwdUnit'.$i.'" name="fwdUnit'.$i.'"> RSSI (dBm) </span>';
    echo '<div class="barfwd">';
    echo '    <div class="emptybar"></div>';
    echo '    <div class="filledbar" id="barRSSILevel'.$i.'" name="barRSSILevel'.$i.'" ></div>';
    echo '</div>';
    echo '<div class="divPowerButton">'; 
    echo '<button class="powerButton" id="setl1power" name="setl1power" onclick="setl1power('.$i.')" >L1</button>';    
    echo '<button class="powerButton" id="setl2power" name="setl2power" onclick="setl2power('.$i.')" >L2</button>';
    echo '<button class="powerButton" id="sethipower" name="sethipower" onclick="sethipower('.$i.')" >H</button>';
    
    echo '</div>';

    echo '<div class="divCHSelect">'; 
    echo '<button class="upDownButton" onclick="decChannel('.$i.')" >-</button>';
    echo '<button class="contentButton" id="chSel'.$i.'" name="chSel'.$i.'" disabled>CH:0</button>';
    echo '<button class="upDownButton" onclick="incChannel('.$i.')" >+</button>';
    echo '</div>';

    echo '<div class="divSQLSelect">'; 
    echo '<button class="upDownButton" onclick="decSqlLevel('.$i.')" >-</button>';
    // echo '<input class="contentButton" type="number" id="sqlLevel'.$i.'" name="sqlLevel'.$i.'" min="1" max="15" step="1" value="">';
    echo '<button class="contentButton" id="sqlLevel'.$i.'" name="sqlLevel'.$i.'" disabled>15</button>';
    echo '<button class="upDownButton" onclick="incSqlLevel('.$i.')" >+</button>';
    echo '</div>';

    echo '<div class="divTempShow">'; 
    echo '<span id="CTRLtemp'.$i.'" name="CTRLtemp'.$i.'"> 37°C </span>';
    echo '</div>';

    echo '<div class="divTrxShow">'; 
    echo '<span id="trxShow'.$i.'" name="trxShow'.$i.'"></span>';
    echo '</div>';

    echo '</div>';
	}
	?>  
</div>	

<div class="container2">
	<?php
	for ($i=5; $i <= 8 ; $i++) { 
		echo '<div class="card" id="card'.$i.'" name="card'.$i.'" style="display: none; ">';
    echo '<h3 class="title" id="title'.$i.'" name="title'.$i.'">Card '.$i.'</h3>';
    echo '<h3 class="fwdLabel" id="fwdValue'.$i.'">0.00 W</h3>';
    echo '<span class="fwdpowerw"> Forward Power(W) </span>';
	  echo '  <div class="barfwd">';
    echo '  	<div class="emptybar"></div>';
    echo '  	<div class="filledbar" id="barFwdLevel'.$i.'" name="barFwdLevel'.$i.'" ></div>';
    echo '</div>';
    echo '<div class="divRwdVswr">';
    echo '	<h3 class="rwdLabel" id="rwdValue'.$i.'" name="rwdValue'.$i.'">0.00 W</h3>';
    echo '	<h3 class="vswrLabel" id="swrValue'.$i.'" name="swrValue'.$i.'">1.000 </h3>';
    echo '</div>';
    echo '<div class="divBarRwdVswr">';
    echo '	<div class="barrwd" id="barrwd">';
    echo '		<div class="emptybar"></div>';
    echo '  	<div class="filledbar" id="barRwdLevel'.$i.'" name="barRwdLevel'.$i.'" ></div>';
    echo '	</div>';
    echo '	<div class="barvswr" id="barvswr">';
    echo '		<div class="emptybar"></div>';
    echo '  	<div class="filledbar" id="barVswrLevel'.$i.'" name="barVswrLevel'.$i.'" ></div>';
    echo '	</div>';
    echo '</div>';
    echo '<div class="divRwdVswrLabel">';
    echo '	<span class="rwdpowerlabel"> Reward Power(W) </span>';
    echo '	<span class="vswrlabel"> VSWR </span>';
    echo '</div>';
    echo '<div class="cardDisconnect" id="cardDisconnect'.$i.'" name="cardDisconnect'.$i.'" style="display: block;">';
    echo '<img src="img/warning-icon.png" alt="warning" class="imgCenter">';
    echo '<span class="cardDisconnectLabel"> Not Connected </span>';
    echo '</div>';
  	echo '</div>';
	}
	?>  
	</div>	

<div class="container3">
	<?php
	for ($i=9; $i <= 12 ; $i++) 
  { 
		echo '<div class="card" id="card'.$i.'" name="card'.$i.'" style="display: none;">';
    echo '<h3 class="title" id="title'.$i.'" name="title'.$i.'">Card '.$i.'</h3>';
    echo '<h3 class="fwdLabel" id="fwdValue'.$i.'">0.00 W</h3>';
    echo '<span class="fwdpowerw"> Forward Power(W) </span>';
	  echo '  <div class="barfwd">';
    echo '  	<div class="emptybar"></div>';
    echo '  	<div class="filledbar" id="barFwdLevel'.$i.'" name="barFwdLevel'.$i.'" ></div>';
    echo '</div>';
    echo '<div class="divRwdVswr">';
    echo '	<h3 class="rwdLabel" id="rwdValue'.$i.'" name="rwdValue'.$i.'">0.00 W</h3>';
    echo '	<h3 class="vswrLabel" id="swrValue'.$i.'" name="swrValue'.$i.'">1.000 </h3>';
    echo '</div>';
    echo '<div class="divBarRwdVswr">';
    echo '	<div class="barrwd" id="barrwd">';
    echo '		<div class="emptybar"></div>';
    echo '  	<div class="filledbar" id="barRwdLevel'.$i.'" name="barRwdLevel'.$i.'" ></div>';
    echo '	</div>';
    echo '	<div class="barvswr" id="barvswr">';
    echo '		<div class="emptybar"></div>';
    echo '  	<div class="filledbar" id="barVswrLevel'.$i.'" name="barVswrLevel'.$i.'" ></div>';
    echo '	</div>';
    echo '</div>';
    echo '<div class="divRwdVswrLabel">';
    echo '	<span class="rwdpowerlabel"> Reward Power(W) </span>';
    echo '	<span class="vswrlabel"> VSWR </span>';
    echo '</div>';
    echo '<div class="cardDisconnect" id="cardDisconnect'.$i.'" name="cardDisconnect'.$i.'" style="display: block;">';
    echo '<img src="img/warning-icon.png" alt="warning" class="imgCenter">';
    echo '<span class="cardDisconnectLabel"> Not Connected </span>';
    echo '</div>';
  	echo '</div>';
	}
	?>  
	</div>	

</div>


</body>
</html>
