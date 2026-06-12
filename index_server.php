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
  <title>IFZ ED137 Converter</title>
  <meta name="description" content="4 Wire to ED-137 Converter" />
  <meta name="keywords" content="ED137, SIP" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="style.css" title="style" />
  <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="myfunctionIndexServer.js"></script>
  <script type = "text/javascript">
	  
  </script>
</head>

<body>
<div id="header">
  <div id="logo">
	<div id="logo_text">
      <!-- class="logo_colour", allows you to change the colour of the text -->
      <h1><a href="index.php"><span class="logo_colour">IFZ 4-Wires to ED137 Converter</span></a></h1>
      <!--          <h2>IFZ Technologies Co.,Ltd.</h2>-->
    </div>
  </div>
  <div id="menubar">
	<ul id="menu">
		<li class="selected"><a href="index.php">Home</a></li>
		<li><a href="network.php">Network</a></li>
		<li><a href="update.php">SYSTEM</a></li>
		<li><a href="logout.php">LOGOUT</a></li>
		<li><a href="changepass.php">CHANGE PASSWORD</a></li>
	</ul>
  </div>
</div>
  <div id="site_content">
      <div class="sidebar">
        <h3>Host Configuration</h3>
<!--
	<h4 align="left">HW Mode</h4>
	  <form method="post" action="">
		<div class="sampleselected">
		  <select name="modeIndex"  class="sampleselected" id="modeIndex">
        		<option class='selectedlt' selected value='0'>Select option</option>
				<option class='selectedlt' value='1'>4 wires to ED137</option>
				<option class='selectedlt' value='2'>ED137 to 4 wires</option>
	  	  </select>
	    </div><br><br>
		<div class="sidebardiv">
			<button class="samplebutton" type="submit" id="hwmode" name="hwmode" onClick="updateswitchInviteMode() ;">Apply</button>
		</div>
	  </form>
-->
        <span class="sidebardiv">
			<h4>SIP User</h4>
        	<input class="sampleselected" type="text" id="localname" name="localname"  value='<?php echo $localname; ?>'/>
        </span>
		
        <span class="sidebardiv">
			<h4>Keep Alive Period (msec)</h4>
        	<input class="sampleselected" type="number" id="keepaliveperoid" name="keepaliveperoid"  min="200" max="1000" value='<?php echo $keepaliveperoid; ?>'/>
        </span>
		
        <span class="sidebardiv">
			<h4>SIP Port</h4>
        	<input class="sampleselected" type="number" id="hostSipPort" name="hostSipPort" min="0" max="65535"  value='<?php echo $hostSipPort; ?>'/>
        </span>
		<p>

		<div class="sidebardiv">
		<button class="samplebutton" type="submit" id="hostupdate" name="hostupdate" onClick="updateHostCfg()" ;>Update</button>
	    </div>
		</p>
        
<!--
		<span class="sidebardiv">
			<h4>Audio Input Level</h4>
		  	<select  class="sampleselected" id="inputgain" name="inputgain" onChange="updateInputgain()">
        	<?php
			  $gainAudioInID = 0;
        		foreach ($gainAudioIn as $row) {
					echo "<option class='selectedlt' value='" . $gainAudioInID . "'>" . $row . "</option>";
					$gainAudioInID+=1;
    			}
		  	?>		  		  
	  	  </select>
	    </span>
		<span class="sidebardiv">
			<h4>Rx Sidetone</h4>
		  	<select  class="sampleselected" id="rxSidetone" name="rxSidetone" onChange="updaterxSidetone()">
        	<?php
			  $rxSidetoneID = 0;
        		foreach ($rxSidetone as $row) {
					echo "<option class='selectedlt' value='" . $rxSidetoneID . "'>" . $row . "</option>";
					$rxSidetoneID+=1;
    			}
		  	?>		  		  
	  	  </select>
	    </span>
		  <span class="sidebardiv">
			<h4>Output Audio Level</h4>
		    <select  class="sampleselected" id="outputgain" name="outputgain" onChange="updateOutputgain()">
		      <?php
				$gainAudioOutID = 0;
        		foreach ($gainAudioOut as $row) {
					echo "<option class='selectedlt' value='" . $gainAudioOutID . "'>" . $row . "</option>";
					$gainAudioOutID+=1;
    			}
		  	?>
	        </select>
		  </span>
-->
        
<!--
		  <span class="sidebardiv">
			<h4>I/O Interface</h4>
		  	<select  class="sampleselected" id="portInterface" name="portInterface" onChange="updatePortInterface()">
        	<?php
			  $audioInterfaceID = 0;
        		foreach ($audioInterface as $row) {
					echo "<option class='selectedlt' value='" . $audioInterfaceID . "'>" . $row . "</option>";
					$audioInterfaceID+=1;
    			}
		  	?>		  		  
	  	  </select>
	    </span>
-->
		<span class="sidebardiv">
			<h4>Main Transmitter</h4>
		  	<select  class="sampleselected" id="pttScheduler" name="pttScheduler" onChange="updatetxScheduler()">
        	<?php
			  $pttSchedulerID = 0;
        		foreach ($pttScheduler as $row) {
					echo "<option class='selectedlt' value='" . $pttSchedulerID . "'>" . $row . "</option>";
					$pttSchedulerID+=1;
    			}
		  	?>		  		  
	  	  </select>
	    </span>
	
		<h4 align="left">System Time</h4>
		<div class="sidebardiv"> <span style="float: left">Local Date </span><br>
			<input class="sampleselected" type="text" id="currentDate" name="currentDate"  value='' disabled/>
		</div>
		<div class="sidebardiv"> <span style="float: left">Local Time </span><br>
			<input class="sampleselected" type="text" id="currentTime" name="currentTime"  value='' disabled/>
		</div>
	<h4 align="left">System</h4>
	  <form method="post" action="">
		<div class="sampleselected">
		  <select name="systemcommamd"  class="systemselect" id="systemcommamd">
        		<option class='selectedlt' selected value='0'>Select option</option>
				<option class='selectedlt' value='1'>System Reboot</option>
				<option class='selectedlt' value='2'>Shutdown</option>
			  	<option class='selectedlt' value='3'>Restart Softphone</option>
	  	  </select>
	    </div><br><br>
		<div class="sidebardiv">
			<button class="samplebutton" type="submit" id="system" name="system";>Apply</button>
		</div>
	  </form>
	  <p></p>
      </div>
	
      <div id="content">
        <h3>Client  Configuratoin</h3>
		    <h4>Node ID 1:</h4>
		  <div class="selected_list"> <span> Name</span>
			<input class="textedited" type="text" id="node1IDName" name="node1IDName" value='<?php echo $node1IDName; ?>'/>
	    </div>
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
			<div class="selected_list"> Type
		<select  class="selecter" id="node1type" name="node1type" onChange="setnode1Type()" >
   		<?php
				$nodeTypeID = 0;
        		foreach ($nodeType as $row) {
					echo "<option class='selectedlt' value='" . $nodeTypeID . "'>" . $row . "</option>";
					$nodeTypeID+=1;
    			}
		  		?>	
  	    </select>
			  </select>
		  </div>
	<div id="node1Normal" name="node1Normal" style="display: contents">
	    <div class="selected_list"> <span>URI</span>
			<input class="textedited" type="text" id="node1Name" name="node1Name" value='<?php echo $node1Name; ?>'/>
	    </div>
		<div class="selected_list">IP Address
          <input class="textedited" type="text" id="node1Address" name="node1Address"  value='<?php echo $node1Address; ?>'/>
        </div>
		<div class="selected_list">SIP Control Port
		    <input class="textedited" type="number" id="node1SipPort" name="node1SipPort"  min="0" max="65535" value='<?php echo $node1SipPort; ?>'/>
		</div>
		<div class="selected_list"><span>Control</span>
		<select  class="selecter" id="node1trxControl" name="node1trxControl" >
   		<?php
			$txControlID = 0;
			foreach ($txControl as $row) {
				echo "<option class='selectedlt' value='" . $txControlID . "'>" . $row . "</option>";
				$txControlID+=1;
			}
		 ?>	
  	    </select>
	    </div>
	</div>
	<div id="divSeparateNode1" name="divSeparateNode1" style="display: none">
        <div class="selected_list"> <span>Tx URI</span>
			<input class="textedited" type="text" id="node1NameTx" name="node1NameTx" value='<?php echo $node1Name; ?>'/>
	    </div>
		<div class="selected_list">Tx IP Address
          <input class="textedited" type="text" id="node1AddressTx" name="node1AddressTx"  value='<?php echo $node1Address; ?>'/>
        </div>
		<div class="selected_list">Tx SIP Control Port
		    <input class="textedited" type="number" id="node1SipPortTx" name="node1SipPortTx"  min="0" max="65535" value='<?php echo $node1SipPort; ?>'/>
		</div>
		<div class="selected_list"><span>Tx Control</span>
		<select  class="selecter" id="node1txControl" name="node1txControl" >
   		<?php
			$txControlID = 0;
			foreach ($txControl as $row) {
				echo "<option class='selectedlt' value='" . $txControlID . "'>" . $row . "</option>";
				$txControlID+=1;
			}
		 ?>	
  	    </select>
	    </div>
		<div class="selected_list"> <span> Rx URI</span>
			<input class="textedited" type="text" id="node1NameRx" name="node1NameRx" value='<?php echo $node1Name; ?>'/>
	    </div>
		<div class="selected_list">Rx IP Address
          <input class="textedited" type="text" id="node1AddressRx" name="node1AddressRx"  value='<?php echo $node1Address; ?>'/>
        </div>
		  
		  <div class="selected_list">Rx SIP Control Port
		    <input class="textedited" type="number" id="node1SipPortRx" name="node1SipPortRx"  min="0" max="65535" value='<?php echo $node1SipPort; ?>'/>
		  </div>
		<div class="selected_list"><span>Rx Control</span>
		<select  class="selecter" id="node1rxControl" name="node1rxControl" >
   		<?php
			$txControlID = 0;
			foreach ($txControl as $row) {
				echo "<option class='selectedlt' value='" . $txControlID . "'>" . $row . "</option>";
				$txControlID+=1;
			}
		 ?>	
  	    </select>
	    </div>
		</div>
		<div class="selected_list"><span>Active</span>
		    <select class="selecter" name="node1Active" id="node1Active">
        		<?php
				$nodeActiveID = 0;
        		foreach ($nodeActive as $row) {
					echo "<option class='selectedlt' value='" . $nodeActiveID . "'>" . $row . "</option>";
					$nodeActiveID+=1;
    			}
		  		?>	
		    </select>
		</div>
		

		<div class="selected_list"><span></span>
			<button class="startstream" type="submit" id="node1Update" name="node1Update" onClick="updateTRxConfig(1)" ;>Update Node 1</button>
		</div>
		<div class="selected_list"><span></span>
			<button class="startstream" type="submit" id="node1Restart" name="node1Restart" onClick="reconnect(1)" ;>Restart Node 1</button>
		</div>
		<div class="selected_list">
	      <h4>Node ID 2:</h4>
	    </div>
		<div class="selected_list"> <span> Name</span>
			<input class="textedited" type="text" id="node2IDName" name="node2IDName" value='<?php echo $node2IDName; ?>'/>
		</div>
		<div class="selected_list"> Type
		<select  class="selecter" id="node2type" name="node2type" onChange="setnode2Type()">
       		<?php
			  	$nodeTypeID = 0;
        		foreach ($nodeType as $row) {
					echo "<option class='selectedlt' value='" . $nodeTypeID . "'>" . $row . "</option>";
					$nodeTypeID+=1;
    			}
		  		?>	
        </select>
		  </div>
	<div id="node2Normal" name="node2Normal" style="display: contents">
	    <div class="selected_list"> <span>URI</span>
          <input class="textedited" type="text" id="node2Name" name="node2Name"  value='<?php echo $node2Name; ?>'/>
        </div>
        <div class="selected_list">IP Address
          <input class="textedited" type="text" id="node2Address" name="node2Address"  value='<?php echo $node2Address; ?>'/>
        </div>
        <div class="selected_list">SIP Control Port
          <input class="textedited" type="number" id="node2SipPort" name="node2SipPort" min="0" max="65535" value='<?php echo $node2SipPort; ?>'/>
        </div>
		<div class="selected_list"><span>Control</span>
		  <select  class="selecter" id="node2trxControl" name="node2trxControl">
   		<?php
			$txControlID = 0;
			foreach ($txControl as $row) {
				echo "<option class='selectedlt' value='" . $txControlID . "'>" . $row . "</option>";
				$txControlID+=1;
			}
		 ?>	
  	    </select>
	    </div>
	</div>
	<div id="divSeparateNode2" name="divSeparateNode2" style="display: none">
        <div class="selected_list"> <span>Tx URI</span>
          <input class="textedited" type="text" id="node2NameTx" name="node2NameTx"  value='<?php echo $node2Name; ?>'/>
        </div>
        <div class="selected_list">Tx IP Address
          <input class="textedited" type="text" id="node2AddressTx" name="node2AddressTx"  value='<?php echo $node2Address; ?>'/>
        </div>
        <div class="selected_list">Tx SIP Control Port
          <input class="textedited" type="number" id="node2SipPortTx" name="node2SipPortTx" min="0" max="65535" value='<?php echo $node2SipPort; ?>'/>
        </div>
	    <div class="selected_list"><span>Tx Control</span>
		<select  class="selecter" id="node2txControl" name="node2txControl" >
   		<?php
			$txControlID = 0;
			foreach ($txControl as $row) {
				echo "<option class='selectedlt' value='" . $txControlID . "'>" . $row . "</option>";
				$txControlID+=1;
			}
		 ?>	
  	    </select>
	    </div>
	    <div class="selected_list"> <span>Rx URI</span>
          <input class="textedited" type="text" id="node2NameRx" name="node2NameRx"  value='<?php echo $node2Name; ?>'/>
        </div>
        <div class="selected_list">Rx IP Address
          <input class="textedited" type="text" id="node2AddressRx" name="node2AddressRx"  value='<?php echo $node2Address; ?>'/>
        </div>
        <div class="selected_list">Rx SIP Control Port
          <input class="textedited" type="number" id="node2SipPortRx" name="node2SipPortRx" min="0" max="65535" value='<?php echo $node2SipPort; ?>'/>
        </div>
		<div class="selected_list"><span>Tx Control</span>
		<select  class="selecter" id="node2rxControl" name="node2rxControl" >
   		<?php
			$txControlID = 0;
			foreach ($txControl as $row) {
				echo "<option class='selectedlt' value='" . $txControlID . "'>" . $row . "</option>";
				$txControlID+=1;
			}
		 ?>	
  	    </select>
	    </div>
		</div>
        <div class="selected_list"><span>Active</span>
          <select name="node2Active" class="selecter" id="node2Active">
			<?php
			 $nodeActiveID = 0;
			foreach ($nodeActive as $row) {
				echo "<option class='selectedlt' value='" . $nodeActiveID . "'>" . $row . "</option>";
				$nodeActiveID+=1;
			}
			?>	
          </select>
        </div>
		
        <!--
		<script>
			function changeId(){
				var currentID = document.getElementById("profilelist").value;
				console.debug(currentID);
				document.getElementById("audioformatlist").value = currentID;
			}
		</script>
-->
		<div class="selected_list"><span></span>
			<button class="startstream" type="submit" id="node2Update" name="node2Update" onClick="updateTRxConfig(2)" ;>Update Node 2</button>
		</div>
		<div class="selected_list"><span></span>
			<button class="startstream" type="submit" id="node2Restart" name="node2Restart" onClick="reconnect(2)" ;>Restart Node 2</button>
		</div>
		
      </div>

	<div class="sidebar2">
	  
	  <h3 align="right">Node Status</h3>
	  <h4 align="right">Main Transmitters</h4>
	<div class="systemdiv"> <span> Node ID</span>
			<input class="textedited3" type="text" id="nodeSelected" name="nodeSelected" value='' disabled/>
	</div>
	  <h4 align="right">Connection</h4>
	<div class="systemdiv"> <span> Node 1</span>
		<input class="textedited3" type="text" id="node1Conn" name="node1Conn"  value='' disabled/>
	</div>
	  <div class="systemdiv"> <span> Node 2</span>
			<input class="textedited3" type="text" id="node2Conn" name="node2Conn"  value='' disabled/>
      </div>
<h4 align="right">Duration</h4>
		<div class="systemdiv"> <span>Node 1</span>
			<input class="textedited3" type="text" id="node1Duration" name="node1Duration"  value='' disabled />
        </div>
		<div class="systemdiv"> <span>Node 2</span>
			<input class="textedited3" type="text" id="node2Duration" name="node2Duration"  value='' disabled />
	    </div>
		<h4 align="right">Tx/Rx Status</h4>
		<div class="systemdiv"> <span style="float: left">Node 1</span>
			<input class="textedited3" type="text" id="node1TRx" name="node1TRx"  value='' disabled/>
      	</div>
		<div class="systemdiv"> <span  style="float: left">Node 2</span>
			<input class="textedited3" type="text" id="node2TRx" name="node2TRx"  value='' disabled/>
	    </div>
		<h4 align="right">Radio Status</h4>
		<div class="systemdiv"> <span style="float: left">Node 1</span>
			<input class="textedited3" type="text" id="node1RadioStatus" name="node1RadioStatus"  value='' disabled/>
      	</div>
		<div class="systemdiv"> <span  style="float: left">Node 2</span>
			<input class="textedited3" type="text" id="node2RadioStatus" name="node2RadioStatus"  value='' disabled/>
	    </div>
		<h4 align="right">VSWR</h4>
		<div class="systemdiv"> <span style="float: left">Node 1 </span>
			<input class="textedited3" type="text" id="node1vswr" name="node1vswr"  value='' disabled />
   	  </div>
		<div class="systemdiv"> <span style="float: left">Node 2 </span>
			<input class="textedited3" type="text" id="node2vswr" name="node2vswr"  value='' disabled/>
   	  </div>
	  <div id="divFrequency" name="divFrequency" style="display: none">
	    <h4 align="right">Frequency</h4>
		<div class="systemdiv"> <span style="float: left">Node 1 </span>
			<input class="textedited3" type="text" id="node1Freq" name="node1Freq" value='' disabled />
   	    </div>
   	  
	  <div class="systemdiv"> <span style="float: left">Node 2 </span>
			<input class="textedited3" type="text" id="node2Freq" name="node2Freq" value='' disabled/>
   	  </div>
   	  </div>
	<div id="divTxpower" name="divTxpower" style="display: contents">
	    <h4 align="right">RF Power</h4>
		<div class="systemdiv"> <span style="float: left">Node 1 </span>
			<input class="textedited3" type="text" id="node1RfPower" name="node1RfPower" value='' disabled />
   	    </div>
   	  
	  <div class="systemdiv"> <span style="float: left">Node 2 </span>
			<input class="textedited3" type="text" id="node2RfPower" name="node2RfPower" value='' disabled/>
   	  </div>
   	  </div>
	<h4 align="right">Squelch</h4>
		<div class="systemdiv"> <span style="float: left">Node 1 </span>
			<input class="textedited3" type="text" id="node1Sql" name="node1Sql" value='' disabled/>
   	  </div>
		<div class="systemdiv"> <span style="float: left">Node 2 </span>
			<input class="textedited3" type="text" id="node2Sql" name="node2Sql" value='' disabled/>
   	  </div>
    </div>
    
  </div>

<div id="footer">
      IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.
</div>
</body>
</html>
