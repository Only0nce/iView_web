<?php
	session_start();
	session_destroy();
?>
<html>
<head>
	<link rel="stylesheet" type="text/css" href="style.css" title="style" />
	<link rel="stylesheet" type="text/css" href="rf-console.css?v=<?php echo time(); ?>" />
<title>iView RF Power Monitor - Change Password</title>
  <script type="text/javascript" src="rf-theme.js?v=<?php echo time(); ?>"></script>
</head>
<body class="rf-console rf-console-auth rf-console-change-password">

<div class="login-page">
  <div class="form">
    <form class="login-form" name="newpass" method="post" action="savenewpass.php">
		<div class="form-group">
      		<input class="form-control" type="text" placeholder="" name="username" id="username" required/>
			<label for="username">Username</label>
		</div>
		<div class="form-group">
      		<input class="form-control" type="password" placeholder="" name="password" id="password" required/>
			<label for="password">Current password</label>
		</div>
		<div class="form-group">
	      	<input class="form-control" type="password" placeholder="" name="newpass" id="newpass" required/>
			<label for="newpass">New password</label>
		</div>
		<div class="form-group">
	      	<input class="form-control" type="password" placeholder="" name="renewpass" id="renewpass" required/>
			<label for="renewpass">Retype new password</label>
		</div>
      
	
		  <button class="button button2" type="submit" name="Submit" value="Change Password">Change Password</button>
	    </form>
	  </div>
</div>
<div id="footer">
      <h4>IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.</h4>
</div>
</body>
</html>
