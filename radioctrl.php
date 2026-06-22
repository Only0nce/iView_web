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
  <title>iRptCtrl</title>
  <meta name="description" content="4 Wire to ED-137 Converter" />
  <meta name="keywords" content="ED137, SIP" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="style.css" title="style" />
  <link rel="stylesheet" type="text/css" href="rf-console.css?v=<?php echo time(); ?>" />
  <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="myfunctionRadioCtrl.js"></script>
  <script type="text/javascript" src="rf-theme.js?v=<?php echo time(); ?>"></script>
<!--  <script type="text/javascript" src="countUp.js"></script>-->
  
  <script type = "text/javascript">
	  
  </script>
</head>

<body class="rf-console rf-console-radio">
<div id="header">
  <div id="logo">
	<div id="logo_text">
      <h1><a href="index.php"><span class="logo_colour">Repeater Controller</span></a></h1>
    </div>
  </div>
<!--
  <div class="showHeaderDiv">
  	<h1 class="text-align-center">UHF Multi-coupler </h1>
  </div>
-->
  <div id="menubar">
	<ul id="menu">
		<li><a href="index.php">HOME</a></li>
		<li class="selected"><a href="radioctrl.php">RADIO CTRL</a></li>
		<li><a href="monitor.php">MONITOR</a></li>
		<li><a href="network.php">NETWORK</a></li>
		<li><a href="update.php">SYSTEM</a></li>
		<li><a href="logout.php">LOGOUT</a></li>
		<li><a href="changepass.php">CHANGE PASSWORD</a></li>
	</ul>
  </div>
</div>
  <div id="site_content">
      <div class="sidebar">
        <h3>Radio Control&nbsp;</h3>
<!--	  <form method="post" action="">-->
		<div class="sampleselected">
		  <select name="sqlLevel"  class="systemselect" id="sqlLevel" onChange="updateSQLLevel()">
        		<option class='selectedlt' selected value='-1'>Set SQL Level</option>
				<option class='selectedlt' value='0'>0</option>
				<option class='selectedlt' value='1'>1</option>
			  	<option class='selectedlt' value='2'>2</option>
			    <option class='selectedlt' value='3'>3</option>
				<option class='selectedlt' value='4'>4</option>
			  	<option class='selectedlt' value='5'>5</option>
			    <option class='selectedlt' value='6'>6</option>
				<option class='selectedlt' value='7'>7</option>
			  	<option class='selectedlt' value='8'>8</option>
			    <option class='selectedlt' value='9'>9</option>
	  	  </select>
	    </div>
		  <div class="sampleselected">
		  <select name="rfPower"  class="systemselect" id="rfPower" onChange="updateRFPwr()">
        		<option class='selectedlt' selected value='-1'>Set RF Power</option>
				<option class='selectedlt' value='LOW1'>LOW1</option>
				<option class='selectedlt' value='LOW2'>LOW2</option>
			  	<option class='selectedlt' value='HIGH'>HIGH</option>
	  	  </select>
	    </div>
		<div class="sidebardiv"> <span style="float: left">Channel Select </span><br>
			<input id="chSel" name="chSel"  class="form-control" type="number" min="0" max="30" >
			
			<!--			<label for="currentDate">Local Date</label>-->
		</div>
		  <button class="button button2" type="submit" id="updateCH" name="updateCH" onClick="updateCHSel()">Update CH</button>
		  <br><br>

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
	<h4 align="left">System</h4>
	  <form method="post" action="">
		<div class="sampleselected">
		  <select name="systemcommamd"  class="systemselect" id="systemcommamd">
        		<option class='selectedlt' selected value='0'>Select option</option>
				<option class='selectedlt' value='1'>System Reboot</option>
<!--				<option class='selectedlt' value='2'>Shutdown</option>-->
<!--			  	<option class='selectedlt' value='3'>Restart Softphone</option>-->
	  	  </select>
	    </div><br><br>
		
		<div class="sidebardiv">
			<button class="button button2" type="submit" id="system" name="system";>Apply</button>
		</div>
	  </form>
	  <p></p>
      </div>
	
      <div id="content">
        <h1 align="center">RF Monitoring</h1>
<!--		<h4>RF Input Level</h4>-->
		<p>&nbsp;</p>
		  
		<div class="chartDiv">
			<div class="showLevelHomeDiv">
				<myLabelLeft id='fwd'>50.00</myLabelLeft>
				<br>
				<myLabelLeft2>Forward Power (W)</myLabelLeft><br>
			</div>
			<canvas id="myCanvas" width="300" height="300" style="border: 0px solid #000000;"></canvas>
			<div class="showLevelHomeDiv" >
				<myLabelRight id='rwd'>10.00</myLabelRight>
				<br>
				<myLabelRight2>Reward Power (W)</myLabelRight><br>
			</div>
		</div>
      </div>
  </div>

<div id="footer">
      <h4>IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.</h4>
</div>
</body>
</html>
