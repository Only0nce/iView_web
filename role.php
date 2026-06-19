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
  <link rel="stylesheet" type="text/css" href="rf-console.css?v=<?php echo time(); ?>" />
  <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="role.js?v=<?php echo time(); ?>"></script>
<!--  <script type="text/javascript" src="countUp.js"></script>-->
  
  <script type = "text/javascript">
	  
  </script>
</head>

<body class="rf-console rf-console-editor rf-console-role">
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
		<li><a href="index.php">HOME</a></li>
		<li><a href="datalogger.php">LOG</a></li>
		<li><a href="cal.php?id=1">CAL</a></li>
		<li><a href="thrulan.php?id=0">Power Sensor</a></li>
		<li><a href="snmp_update.php">Rx SNMP Info</a></li>
		<li class="selected"><a href="role.php?id=0">ROLE</a></li>
		<li><a href="network.php">NETWORK</a></li>
		<li><a href="wifi.php">WiFi</a></li>
		<li><a href="update.php">System</a></li>
		<li><a href="logout.php">LOGOUT</a></li>
		<li><a href="changepass.php">CHANGE PASS.</a></li>
	</ul>
  </div>
</div>
  <div id="site_content">
        
	<?php			
	if(isset($_GET['id']))
		$newid = $_GET['id'];
	if(isset($_POST['id']))
		$newid = $_POST['id'];

	if(isset($_POST['system']))
	{    
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
	if ($newid != 0)
	{
			echo '<script language="javascript">';
		  echo 'setCurrentID('.$newid.')';
		  echo '</script>';
	}
	?>

	
<div class="container">
<h3 class="truelanLabel" id="newtruelan" name="newtruelan" >New Role</h3>
</div>
<div class="container6">
		<div class="card" id="card0" name="card0" style="display: block; background-color: rgba(0, 0, 0, 0.0)">
			<?php	
				
				echo '<div class="cardTxTab" id="cardTxId0" name="cardTxId0" onclick="setCurrentID(0)" style="display: block; background-color:rgba(0,0,0,0.3)">';
				echo '<img class="cardTxTabImage" src="img/newRole.png" alt="Flowers in Chania">';
				echo '<span class="cardTxTabText3" id="cardNameId0" name="cardNameId0"> New </span>';
				echo '</div>';
			?>
		</div>
</div>


	<div class="container8">
		<div class="card" id="card" name="card" style="display: block; background-color: rgba(0, 0, 0, 0.0)">
			<div class="selected_list"> <span>Role Name</span>
			<input class="form-control" type="text" id="roleName" name="roleName"  placeholder="Role Name" value=''/>			
		</div>
		</div>
	</div>
	<div class="container9">
		<div class="card" id="card0" name="card0" style="display: block; background-color: rgba(0, 0, 0, 0.0)">
			<div class="cardRole" id="cardRoleId1" name="cardRoleId1" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>1</span></div>
			  <select id="chId1" name="chId1" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania">
				<div class="cardRoleCheckbox" style="display: none">
				<section style="visibility:hidden;">
						<label for="rs232Id1" class="rs232Id1">
							<input type="checkbox" name="rs232Id1" id="rs232Id1" class="rs232Id1__input">
							<span class="rs232Id1__button"><img src="img/correct.png" alt="correct" class="rs232Id1__button--correct"></span>
						</label>
				</section>
				</div>
			</div>
			<div class="cardRole" id="cardRoleId3" name="cardRoleId3" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>3</span></div>
			  <select id="chId3" name="chId3" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardRoleId5" name="cardRoleId5" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>5</span></div>
			  <select id="chId5" name="chId5" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardRoleId7" name="cardRoleId7" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>7</span></div>
			  <select id="chId7" name="chId7" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardRoleId9" name="cardRoleId9" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>9</span></div>
			  <select id="chId9" name="chId9" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardRoleId11" name="cardRoleId11" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>11</span></div>
			  <select id="chId11" name="chId11" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardRoleId13" name="cardRoleId13" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>13</span></div>
			  <select id="chId13" name="chId13" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardRoleId15" name="cardRoleId15" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>15</span></div>
			  <select id="chId15" name="chId15" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardButton" style="display: block; background-color: rgba(0, 0, 0, 0.0)">
						<button class="button button2" type="button" id="removerolebutton" style="margin-top: 10px; display: none;" onClick="removeRole();">REMOVE</button>
			</div>
			</div>
		<div class="card" id="card0" name="card0" style="display: block; background-color: rgba(0, 0, 0, 0.0)">
			<div class="cardRole" id="cardRoleId2" name="cardRoleId2" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>2</span></div>
			  <select id="chId2" name="chId2" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
				<div class="cardRoleCheckbox" style="display: none">
				<section style="visibility:hidden;">
						<label for="rs232Id2" class="rs232Id2">
							<input type="checkbox" name="rs232Id2" id="rs232Id2" class="rs232Id2__input">
							<span class="rs232Id2__button"><img src="img/correct.png" alt="correct" class="rs232Id2__button--correct"></span>
						</label>
				</section>
				</div>
			<div class="cardRole" id="cardRoleId4" name="cardRoleId4" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>4</span></div>
			  <select id="chId4" name="chId4" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardRoleId6" name="cardRoleId6" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>6</span></div>
			  <select id="chId6" name="chId6" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardRoleId8" name="cardRoleId8" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>8</span></div>
			  <select id="chId8" name="chId8" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardRoleId10" name="cardRoleId10" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>10</span></div>
			  <select id="chId10" name="chId11" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardRoleId12" name="cardRoleId12" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>12</span></div>
			  <select id="chId12" name="chId12" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardRoleId14" name="cardRoleId14" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>14</span></div>
			  <select id="chId14" name="chId14" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardRoleId16" name="cardRoleId16" style="display: block; background-color: rgba(0, 0, 0, 0.1)">
					<div class="cardRoleTextID"> <span>16</span></div>
			  <select id="chId16" name="chId16" class="selectedTrueLan" ><option selected value='0'>Disable</option></select>
				<img class="cardRoleTabImage" src="img/radioIcon.png" alt="Flowers in Chania"></div>
			<div class="cardRole" id="cardButton" style="display: block; background-color: rgba(0, 0, 0, 0.0)">
						<button class="button button2" type="button" id="saverolebutton" style="margin-top: 10px;" onClick="newRole();">NEW</button>
						<button class="button button2" type="button" id="selectrolebutton" style="margin-top: 10px; display: none;" onClick="selectedRole();">SELECT</button>
			</div>
		</div>
	</div>
</div>


</body>
</html>
