/* Shop Commands Chat-Plugin
 * 
 * This is a chat-plugin for PS that
 * enables a server to have a form 
 * of economy in the shape of a shop.
 * COMMANDS: /shop, /buy, /transferbucks, /givebucks, 
 * /takebucks, /atm, /richestuser, /moneylog, /givesymbol, 
 * /customsymbol, /resetsymbol
 * Credits: panpawn, chalenged, jd
 */

var fs = require('fs');
var closeShop = false;
var closedShop = 0;
var moment = require('moment');
function logTransaction (message) {
	if (!message) return false;
	fs.appendFile('logs/transactions.log','['+new Date().toUTCString()+'] '+message+'\n');
}

exports.commands = {
    	shop: function(target, room, user) {
		if (!this.canBroadcast()) return;
		if (room.id === 'lobby' && this.broadcasting) {
			return this.sendReplyBox('<center>Click <button name="send" value="/shop" style="background-color: black; font-color: white;" title="Enter the Shop!"><font color="white"><b>here</button></b></font> to enter our shop!');
		} else {
			var buttonStyle = 'border-radius: 5px; background: linear-gradient(-30deg, #fff493, #e8d95a, #fff493); color: black; text-shadow: 0px 0px 5px #d6b600; border-bottom: 2px solid #635b00; border-right: 2px solid #968900;';
			var topStyle = 'background: linear-gradient(10deg, #FFF8B5, #eadf7c, #FFF8B5); color: black; border: 1px solid #635b00; padding: 2px; border-radius: 5px;';
			var descStyle = 'border-radius: 5px; border: 1px solid #635b00; background: #fff8b5; color: black;';
			var top = '<center><h3><b><u>Gold Bucks Shop</u></b></h3><table style="' + topStyle + '" border="1" cellspacing ="2" cellpadding="3"><tr><th>Item</th><th>Description</th><th>Cost</th></tr>';
			var bottom = '</table><br />To buy an item from the shop, click the respective button for said item.<br>Do /getbucks to learn more about how to obtain bucks. </center>';
			function table(item, desc, price) {
				return '<tr><td style="' + descStyle + '"><button title="Click this button to buy a(n) ' + item + ' from the shop." style="' + buttonStyle + '" name="send" value="/buy ' + item + '">' + item + '</button></td><td style="' + descStyle + '">' + desc + '</td><td style="' + descStyle + '">' + price + '</td></tr>';
			}
			return this.sendReply('|raw|' +
				top +
				table("Symbol", "Buys a custom symbol to go infront of name and puts you towards the top of userlist (lasts 2 hrs from logout)", 5) +
				table("Declare", "Advertisement declare for a room on the server from an Administrator / Leader.", 20) +
				table("Fix", "Ability to modify a custom avatar, trainer card, userlist icon, or custom emoticon.", 30) +
				table("Custom", "Buys a custom avatar to be applied to your name (you supply)", 35) +
				table("Animated", "Buys an animated avatar to be applied to your name (you supply)", 45) +
				table("Room", "Buys a public unofficial chat room - will be deleted if inactive. Must have a valid purpose; staff can reject making these.", 75) +
				table("Musicbox", "A command that lists / links up to 8 of your favorite songs", 80) +
				table("Trainer", "Gives you a custom command - you provide the HTML and command name.", 100) +
				table("Emote", "A custom chat emoticon such as \"Kappa\" - must be 30x30", 400) +
				table("Color", "This gives your username a custom color on the userlist and in all rooms (existing at time of purchase)", 900) +
				table("Icon", "This gives your username a custom userlist icon on our regular client - MUST be a Pokemon and has to be 32x32.", 1000) +
				bottom
			);
		}
		if (closeShop) return this.sendReply('|raw|<center><h3><b>The shop is currently closed and will open shortly.</b></h3></center>');
	},
	lockshop: 'closeshop',
	closeshop: function(target, room, user) {
		if (!user.can('hotpatch')) return this.sendReply('You do not have enough authority to do this.');
		if (closeShop && closedShop === 1) closedShop--;
		if (closeShop) {
			return this.sendReply('The shop is already closed. Use /openshop to open the shop to buyers.');
		} else if (!closeShop) {
			if (closedShop === 0) {
				this.sendReply('Are you sure you want to close the shop? People will not be able to buy anything. If you do, use the command again.');
				closedShop++;
			} else if (closedShop === 1) {
				closeShop = true;
				closedShop--;
				this.add('|raw|<center><h4><b>The shop has been temporarily closed, during this time you cannot buy items.</b></h4></center>');
			}
		}
	},
	openshop: function(target, room, user) {
		if (!user.can('hotpatch')) return this.sendReply('You do not have enough authority to do this.');
		if (!closeShop && closedShop === 1) closedShop--;
		if (!closeShop) {
			return this.sendRepy('The shop is already closed. Use /closeshop to close the shop to buyers.');
		} else if (closeShop) {
			if (closedShop === 0) {
				this.sendReply('Are you sure you want to open the shop? People will be able to buy again. If you do, use the command again.');
				closedShop++;
			} else if (closedShop === 1) {
				closeShop = false;
				closedShop--;
				this.add('|raw|<center><h4><b>The shop has been opened, you can now buy from the shop.</b></h4></center>');
			}
		}
	},
	takebucks: 'removebucks',
	removebucks: function(target, room, user) {
		if (!user.can('pban')) return this.errorReply("You do not have enough authority to do this.");
		var parts = target.split(',');
		var removeName = parts[0];
		var amount = toId(parts[1]);

		//checks
		if (!removeName || !amount) return this.errorReply("Usage: /removebucks [user], [amount]");
		if (Number(amount) < 1) return this.errorReply("Cannot be less than 1.");
		if (isNaN(Number(amount))) return this.errorReply("The amount you take must be a number.");
        if (~String(amount).indexOf('.')) return this.errorReply("Cannot contain a decimal.");
        if (amount > 1000) return this.errorReply("You cannot remove more than 1,000 bucks at once.");

		//take the bucks
		economy.writeMoney('money', toId(removeName),-amount);

		//send replies
		var lbl = (amount == 1 ? ' Gold buck' : ' Gold bucks');
		logTransaction(user.name + " has removed " + amount + lbl + " from " + removeName + ".");
		this.sendReply("You have removed " + amount + lbl + " from " + removeName + ".");
		if (Users(toId(removeName))) Users(toId(removeName)).popup("|modal|" + user.name + " has removed " + amount + lbl + " from you.");
	},
	awardbucks: 'givebucks',
	gb: 'givebucks',
	givebucks: function(target, room, user) {
		if (!user.can('pban')) return this.errorReply("You do not have enough authority to do this.");
		var parts = target.split(',');
		var giveName = parts[0];
		var amount = toId(parts[1]);

		//checks
		if (!giveName || !amount) return this.errorReply("Usage: /givebucks [user], [amount]");
		if (Number(amount) < 1) return this.errorReply("Cannot be less than 1.");
		if (isNaN(Number(amount))) return this.errorReply("The amount you give must be a number.");
        if (~String(amount).indexOf('.')) return this.errorReply("Cannot contain a decimal.");
        if (amount > 1000) return this.errorReply("You cannot give more than 1,000 bucks at once.");

		//give the bucks
		economy.writeMoney('money', toId(giveName),+amount);

		//send replies
		var lbl = (amount == 1 ? ' Gold buck' : ' Gold bucks');
		logTransaction(user.name + " has given " + amount + lbl + " to " + giveName + ".");
		this.sendReply("You have given " + amount + lbl + " to " + giveName + ".");
		if (Users(toId(giveName))) Users(toId(giveName)).popup("|modal|" + user.name + " has given you " + amount + lbl + ".");
	},
	buy: function(target, room, user) {
		if (!target) return this.errorReply("You need to pick an item! Type /buy [item] to buy something.");
		if (closeShop) return this.errorReply("The shop is currently closed and will open shortly.");

		var parts = target.split(',');
		var output = '';
		var price;

		function link(link, formatted) {
			return '<a href="' + link + '" target="_blank">' + formatted + '</a>';
		}
		function nameColor(name) {
			return '<b><font color="' + Gold.hashColor(name) + '">' + Tools.escapeHTML(name) + '</font></b>';
		}
		function moneyCheck(price) {
			if (economy.readMoney(user.userid) < price) return false;
			if (economy.readMoney(user.userid) >= price) return true;
		}
		function alertStaff(message, staffRoom) {
			Gold.pmUpperStaff('/html ' + message, '~Server', false);
			if (staffRoom) {
				Rooms.get('staff').add('|raw|<b>' + message + '</b>');
				Rooms.get('staff').update();
			}
		}
		function processPurchase(price, item, desc) {
			if (!desc) desc = '';
			if (economy.readMoney(user.userid) < price) return false; //this should never happen
			if (economy.readMoney(user.userid) >= price) {
				economy.writeMoney('money', user.userid, -price);
				logTransaction(user.name + ' has purchased a(n) ' + item + '. ' + desc);
			}
		}

		switch (toId(parts[0])) {

			case 'symbol':
				price = 5;
				if (Gold.hasBadge(user.userid, 'vip')) return this.errorReply("You are a VIP user - you do not need to buy custom symbols from the shop.  Use /customsymbol to change your symbol.");
				if (!moneyCheck(price)) return this.errorReply("You do not have enough bucks for this item at this time, sorry.");
				processPurchase(price, parts[0]);
				this.sendReply("You have purchased a custom symbol. You will have this until you log off for more than an hour.");
				this.sendReply("Use /customsymbol [symbol] to change your symbol now!");
				user.canCustomSymbol = true;
				break;

			case 'custom':
			case 'avatar':
			case 'customavatar':
				price = 35;
				if (Gold.hasBadge(user.userid, 'vip')) return this.errorReply("You are a VIP user - you do not need to buy avatars from the shop.  Use /customavatar to change your avatar.");
				if (!moneyCheck(price)) return this.errorReply("You do not have enough bucks for this item at this time, sorry.");
				if (!parts[1]) return this.errorReply("Usage: /buy avatar, [link to avatar].  Must be a PNG or JPG.");
				var filepaths = ['.png', '.jpg'];
				if (!~filepaths.indexOf(parts[1].substr(-4))) return this.errorReply("Your image for a regular custom avatar must be either a PNG or JPG. (If it is a valid file type, it will end in one of these)");
				processPurchase(price, parts[0], 'Image: ' + parts[1]);
				if (Config.customavatars[user.userid]) output = ' | <button name="send" value="/sca delete, ' + user.userid + '" target="_blank" title="Click this to remove current avatar.">Click2Remove</button>';
				alertStaff(nameColor(user.name) + ' has purchased a custom avatar. Image: ' + link(parts[1].replace(' ', ''), 'desired avatar'), true);
				alertStaff('<center><button name="send" value="/sca set, ' + toId(user.name) + ', ' + parts[1] + '" target="_blank" title="Click this to set the above custom avatar.">Click2Set</button> ' + output + '</center>', false);
				this.sendReply("You have bought a custom avatar from the shop.  The staff have been notified and will set it ASAP.");
				break;

			case 'color':
			case 'customcolor':
				price = 900;
				if (!moneyCheck(price)) return this.errorReply("You do not have enough bucks for this item at this time, sorry.");
				if (!parts[1]) return this.errorReply("Usage: /buy color, [hex code OR name of an alt you want the color of]");
				if (parts[1].length > 20) return this.errorReply("This is not a valid color, try again.");
				processPurchase(price, parts[0], parts[1]);
				alertStaff(nameColor(user.name) + ' has purchased a custom color. Color: ' + parts[1], true);
				this.sendReply("You have purchased a custom color: " + parts[1] + " from the shop.  Please screen capture this in case the staff do not get this message.");
				break;

			case 'emote':
			case 'emoticon':
				price = 400;
				if (!moneyCheck(price)) return this.errorReply("You do not have enough bucks for this item at this time, sorry.");
				if (!parts[1] || !parts[2]) return this.errorReply("Usage: /buy emote, [emote code], [image for the emote]");
				var emoteFilepaths = ['.png', '.jpg', '.gif'];
				if (!~emoteFilepaths.indexOf(parts[2].substr(-4))) return this.errorReply("Emoticons must be in one of the following formats: PNG, JPG, or GIF.");
				if (Gold.emoticons.chatEmotes[parts[1].remove(' ')]) return this.errorReply("An emoticon with this trigger word already exists on this server.");
				processPurchase(price, parts[0], 'Emote: ' + parts[1] + ' Link: ' + parts[2]);
				alertStaff(nameColor(user.name) + " has purchased a custom emote. Emote \"" + parts[1].trim() + "\": " + link(parts[2].replace(' ', ''), 'desired emote'), true);
				alertStaff('<center><img title=' + parts[1] + ' src=' + parts[2] + '><br /><button name="send" value="/emote add, ' + parts[1] + ', ' + parts[2] + '" target="_blank" title="Click to add the emoticon above.">Click2Add</button></center>', false);
				this.sendReply("You have bought a custom emoticon from the shop.  The staff have been notified and will add it ASAP.");
				break;

			case 'animated':
				price = 45;
				if (Gold.hasBadge(user.userid, 'vip')) return this.errorReply("You are a VIP user - you do not need to buy animated avatars from the shop.  Use /customavatar to change your avatar.");
				if (!moneyCheck(price)) return this.errorReply("You do not have enough bucks for this item at this time, sorry.");
				if (!parts[1]) return this.errorReply("Usage: /buy animated, [link to avatar].  Must be a GIF.");
				if (parts[1].split('.').pop() !== 'gif') return this.errorReply("Your animated avatar must be a GIF. (If it's a GIF, the link will end in .gif)");
				processPurchase(price, parts[0], 'Image: ' + parts[1]);
				if (Config.customavatars[user.userid]) output = ' | <button name="send" value="/sca delete, ' + user.userid + '" target="_blank" title="Click this to remove current avatar.">Click2Remove</button>';
				alertStaff(nameColor(user.name) + ' has purchased a custom animated avatar. Image: ' + link(parts[1].replace(' ', ''), 'desired avatar'), true);
				alertStaff('<center><button name="send" value="/sca set, ' + toId(user.name) + ', ' + parts[1] + '" target="_blank" title="Click this to set the above custom avatar.">Click2Set</button> ' + output + '</center>', false);
				this.sendReply("You have purchased a custom animated avatar.  The staff have been notified and will add it ASAP.");
				break;

			case 'room':
			case 'chatroom':
				price = 75;
				if (!moneyCheck(price)) return this.errorReply("You do not have enough bucks for this item at this time, sorry.");
				if (!parts[1]) return this.errorReply("Usage: /buy room, [room name]");
				var bannedRoomNames = [',', '|', '[', '-'];
				if (~bannedRoomNames.indexOf(parts[1])) return this.errorReply("This room name is not valid, try again.");
				processPurchase(price, parts[0], 'Room name: ' + parts[1]);
				alertStaff(nameColor(user.name) + ' has purchased a chat room.  Room name: ' + parts[1], true);
				this.sendReply("You have purchased a room.  The staff have been notified and it will be created shortly as long as it meets our basic rules.");
				break;

			case 'trainer':
			case 'trainercard':
				price = 100;
				if (!moneyCheck(price)) return this.errorReply("You do not have enough bucks for this item at this time, sorry.");
				processPurchase(price, parts[0]);
				alertStaff(nameColor(user.name) + ' has purchased a trainer card.', true);
				this.sendReply("|html|You have purchased a trainer card.  Please use <a href=http://goldservers.info/site/trainercard.html>this</a> to make your trainer card and then PM a leader or administrator the HTML with the command name you want it to have.");
				break;

			case 'mb':
			case 'musicbox':
				price = 80;
				if (!moneyCheck(price)) return this.errorReply("You do not have enough bucks for this item at this time, sorry.");
				if (!Gold.createMusicBox(user)) return this.errorReply("You already have a music box! There's no need to buy another.");
				processPurchase(price, parts[0]);
				alertStaff(nameColor(user.name) + ' has purchased a music box.', true);
				Gold.createMusicBox(user); // give the user a music box
				this.parse('/' + toId(parts[0]) + ' help');
				this.sendReply("You have purchased a music box. You may have a maximum of 6 songs in it.");
				break;

			case 'fix':
				price = 30;
				if (Gold.hasBadge(user.userid, 'vip')) price = 0;
				if (!moneyCheck(price)) return this.errorReply("You do not have enough bucks for this item at this time, sorry.");
				processPurchase(price, parts[0]);
				alertStaff(nameColor(user.name) + ' has purchased a fix from the shop.', true);
				user.canFixItem = true;
				this.sendReply("You have purchased a fix from the shop.  You can use this to alter your trainer card, music box, or custom chat emoticon.  PM a leader or administrator to proceed.");
				break;

			case 'ad':
			case 'declare':
				price = 20;
				if (Gold.hasBadge(user.userid, 'vip')) price = 0;
				if (!moneyCheck(price)) return this.errorReply("You do not have enough bucks for this item at this time, sorry.");
				processPurchase(price, parts[0]);
				alertStaff(nameColor(user.name) + ' has purchased the ability to declare from the shop.', true);
				this.sendReply("You have purchased an advertisement declare from the shop.  Please prepare an advertisement for your room; a leader or administrator will soon be PMing you to proceed.");
				break;

			case 'userlisticon':
			case 'icon':
				price = 1000;
				if (Gold.hasBadge(user.userid, 'vip')) price = 0;
				if (!moneyCheck(price)) return this.errorReply("You do not have enough bucks for this item at this time, sorry.");
				if (parts[1].length < 3) return this.errorReply("Usage: /buy icon, [32x32 icon image]");
				var iconFilepaths = ['.png', '.jpg', '.gif'];
				if (!~iconFilepaths.indexOf(parts[1].substr(-4))) return this.errorReply("Your image for a custom userlist icon must be a PNG, JPG, or GIF.");
				processPurchase(price, parts[0], 'Image: ' + parts[1]);
				alertStaff(nameColor(user.name) + ' has purchased a custom userlist icon. Image: ' + link(parts[1].replace(' ', ''), 'desired icon'), true);
				alertStaff('<center><button name="send" value="/icon ' + user.userid + ', ' + parts[1] + '" target="_blank" title="Click this to set the above custom userlist icon.">Click2Set</button></center>', false);
				this.sendReply("You have purchased a custom userlist icon.  The staff have been notified and this will be added ASAP.");
				break;

			default:
				this.errorReply("Shop item not found.  Check spelling?");
		}
	},
	tb: 'transferbucks',
	transferbucks: function(target, room, user) {
		var parts = target.split(',');

		//checks
		if (!parts[0] || !parts[1]) return this.errorReply("Usage: /transferbucks [user], [amount]");
		if (Number(parts[1]) < 1) return this.errorReply("Cannot be less than 1.");
		if (isNaN(Number(parts[1]))) return this.errorReply("The amount you transfer must be a number.");
        if (~String(parts[1]).indexOf('.')) return this.errorReply("Cannot contain a decimal.");
        if (toId(parts[0]) == user.userid) return this.errorReply("You cannot transfer bucks to yourself.");
        var bucks = toId(parts[1]);
		if (economy.readMoney(user.userid) < bucks) return this.errorReply("You cannot transfer more than you have.");

		//finally, transfer the bucks
		economy.writeMoney('money', user.userid, -bucks);
		setTimeout(function() {
			economy.writeMoney('money', toId(parts[0]), +bucks);
		}, 3000);

		//log the transaction
		var lbl = (bucks == 1 ? ' Gold buck' : ' Gold bucks');
		logTransaction(user.name + " has transfered " + bucks + lbl + " to " + parts[0]);

		//send return messages
		this.sendReply("You have transfered " + bucks + lbl + " to " + parts[0] + ".");
		if (Users(toId(parts[0]))) {
			Users(toId(parts[0])).popup("|modal|" + user.name + " has transferred " + bucks + lbl + " to you.");
			Users(toId(parts[0])).sendTo(room, "|raw|<b>" + Tools.escapeHTML(user.name) + " has transferred " + bucks + lbl + " to you.</b>");
		}
	},
	wallet: 'atm',
	satchel: 'atm',
	fannypack: 'atm',
	purse: 'atm',
	bag: 'atm',
	bank: 'atm',
	atm: function(target, room, user) {
		if (!this.canBroadcast()) return;
		if (!target) target = user.name;
		var originalName = Tools.escapeHTML(target);
		target = toId(target);
		function atm(target) {
			var bucks = economy.readMoney(target);
			var label = (bucks == 1 ? ' Gold buck' : ' Gold bucks');
			var output = "<u>Gold Wallet:</u><br />";
			switch (bucks) {
				case 0:
					output += "<b><font color=\"" + Gold.hashColor(target) + "\">" + originalName + "</font></b> does not have any Gold bucks.";
					break;
				default:
					output += "<b><font color=\"" + Gold.hashColor(target) + "\">" + originalName + "</font></b> has " + bucks + label + ".";
			}
			return output;
		}
		return this.sendReplyBox(atm(target));
	},
	whosgotthemoneyz: 'richestuser',
	richestuser: function(target, room, user) {
		if (!this.canBroadcast()) return;
		var data = fs.readFileSync('config/money.csv', 'utf8');
		var row = ('' + data).split("\n");
		var userids = {
			id: [],
			money: []
		};
		var highest = {
			id: [],
			money: []
		};
		var size = 0;
		var amounts = [];
		for (var i = row.length; i > -1; i--) {
			if (!row[i]) continue;
			var parts = row[i].split(",");
			userids.id[i] = parts[0];
			userids.money[i] = Number(parts[1]);
			size++;
			if (isNaN(parts[1]) || parts[1] === 'Infinity') userids.money[i] = 0;
		}
		for (var i = 0; i < 10; i++) {
			var tempHighest = 0;
			for (var x = 0; x < size; x++) {
				if (userids.money[x] > tempHighest) tempHighest = userids.money[x];
			}
			for (var x = 0; x < size; x++) {
				var found = false;
				if (userids.money[x] === tempHighest && !found) {
					highest.id[i] = userids.id[x];
					highest.money[i] = userids.money[x];
					userids.id[x];
					userids.money[x] = 0;
					found = true;
				}
			}
		}
		return this.sendReplyBox('<b>The richest users are:</b>' +
			'<br>1. ' + highest.id[0] + ': ' + highest.money[0] +
			'<br>2. ' + highest.id[1] + ': ' + highest.money[1] +
			'<br>3. ' + highest.id[2] + ': ' + highest.money[2] +
			'<br>4. ' + highest.id[3] + ': ' + highest.money[3] +
			'<br>5. ' + highest.id[4] + ': ' + highest.money[4] +
			'<br>6. ' + highest.id[5] + ': ' + highest.money[5] +
			'<br>7. ' + highest.id[6] + ': ' + highest.money[6] +
			'<br>8. ' + highest.id[7] + ': ' + highest.money[7] +
			'<br>9. ' + highest.id[8] + ': ' + highest.money[8] +
			'<br>10. ' + highest.id[9] + ': ' + highest.money[9]);
	},
	moneylog: function (target, room, user) {
		if (!this.can('hotpatch')) return false;
		if (!target) return this.sendReply("Usage: /moneylog [number] to view the last x lines OR /moneylog [text] to search for text.");
		if (isNaN(Number(target))) var word = true;
		var lines = fs.readFileSync('logs/transactions.log', 'utf8').split('\n').reverse();
		var output = '';
		var count = 0;
		var regex = new RegExp(target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "gi");
 
		if (word) {
			output += 'Displaying last 50 lines containing "' + target + '":\n';
			for (var line in lines) {
				if (count >= 50) break;
				if (!~lines[line].search(regex)) continue;
				output += lines[line] + '\n';
				count++;
			}
		} else {
			if (target > 100) target = 100;
			output = lines.slice(0, (lines.length > target ? target : lines.length));
			output.unshift("Displaying the last " + (lines.length > target ? target : lines.length) + " lines:");
			output = output.join('\n');
		}
		user.popup(output);
	},
	givesymbol: 'gs',
	gs: function(target, room, user) {
		if (!target) return this.errorReply('/givesymbol [user] - Gives permission for this user to set a custom symbol.');
		if (!Users(target)) return this.errorReply("Target user not found.  Check spelling?");
		Users(target).canCustomSymbol = true;
		Users(target).popup('|modal|' + user.name + ' have given you a FREE custom symbol.  Use /customsymbol to set your symbol.');
	},
	cs: 'customsymbol',
	customsymbol: function(target, room, user) {
		if (!user.canCustomSymbol && !Gold.hasBadge(user.userid, 'vip')) return this.sendReply('You don\'t have the permission to use this command.');
		//var free = true;
		if (user.hasCustomSymbol) return this.sendReply('You currently have a custom symbol, use /resetsymbol if you would like to use this command again.');
		if (!this.canTalk()) return;
		//if (!free) return this.sendReply('Sorry, we\'re not currently giving away FREE custom symbols at the moment.');
		if (!target || target.length > 1) return this.sendReply('/customsymbol [symbol] - changes your symbol (usergroup) to the specified symbol. The symbol can only be one character');
		if (~target.indexOf('\u202e')) return this.sendReply("nono riperino");
		var bannedSymbols = /[ +<>$%‽!★@&~#卐|A-z0-9]/;
		if (target.match(bannedSymbols)) return this.sendReply('Sorry, but you cannot change your symbol to this for safety/stability reasons.');
		user.getIdentity = function(roomid) {
			if (this.locked) return '‽' + this.name;
			if (roomid) {
				var room = Rooms.rooms[roomid];
				if (room.isMuted(this)) return '!' + this.name;
				if (room && room.auth) {
					if (room.auth[this.userid]) return room.auth[this.userid] + this.name;
					if (room.isPrivate === true) return ' ' + this.name;
				}
			}
			return target + this.name;
		};
		user.updateIdentity();
		user.canCustomSymbol = false;
		user.hasCustomSymbol = true;
		return this.sendReply("Your symbol has been set.");
	},
	/*
	halloween: function(target, room, user) {
		if (user.hasCustomSymbol) return this.sendReply('You currently have a custom symbol, use /resetsymbol if you would like to use this command again.');
		if (!this.canTalk()) return;
		var symbols = '☠';
		user.getIdentity = function() {
			if (this.muted) return '!' + this.name;
			if (this.locked) return '‽' + this.name;
			return symbols + this.name;
		};
		user.updateIdentity();
		user.canCustomSymbol = false;
		user.hasCustomSymbol = true;
		return this.sendReply("Happy Halloween! ☠");
	},
	xmas: 'christmas',
	christmas: function(target, room, user) {
		if (user.hasCustomSymbol) return this.sendReply('You currently have a custom symbol, use /resetsymbol if you would like to use this command again.');
		if (!this.canTalk()) return;
		var symbols = '⛄';
		user.getIdentity = function() {
			if (this.muted) return '!' + this.name;
			if (this.locked) return '‽' + this.name;
			return symbols + this.name;
		};
		user.updateIdentity();
		user.canCustomSymbol = false;
		user.hasCustomSymbol = true;
		user.lastCustomSymbol = 
		return this.sendReply("Merry Christmas, and Happy Holidays! " + symbols);
	},
	*/
	rs: 'resetsymbol',
	resetsymbol: function(target, room, user) {
		if (!user.hasCustomSymbol) return this.sendReply('You don\'t have a custom symbol!');
		user.getIdentity = function() {
			if (this.muted) return '!' + this.name;
			if (this.locked) return '‽' + this.name;
			return this.group + this.name;
		};
		user.hasCustomSymbol = false;
		delete user.getIdentity;
		user.updateIdentity();
		this.sendReply('Your symbol has been reset.');
	},
};
