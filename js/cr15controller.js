/*
    This file is part of CR15Roll.
    
    CR15Roll is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
(function( global ) {
  var CR15Controller = (function() {
    var logCounter = 1;

    return {
      logMessage: function (title, msg) {
        var rl = $('#list-resultlog'),
            msgItem = '<li><h3>(' + logCounter.toString() + ') ' + title + '</h3>' + msg + '</li>',
            lastItem = null;

        rl.append(msgItem);
        rl.listview('refresh');
        logCounter++;
      },
      onRangedWeaponChanged: function(event, ui) {
        var name = $('#select-ranged-weapon').val(),
            ctr = 0,
            TR = 0;
        for (; ctr < CR15Rolls.WEAPONS_TABLE.length; ctr++) {
          if (name === CR15Rolls.WEAPONS_TABLE[ctr].name) {
            TR = CR15Rolls.WEAPONS_TABLE[ctr].TR;
            break;
          }
        }
        for (ctr = 1; ctr < 5; ctr++) {
          if (ctr <= TR) {
            $('#div-ranged-target-'+ctr).slideDown();
          }
          else {
            $('#div-ranged-target-'+ctr).slideUp();
          }
        }
      },
      onRangedTargetChanged: function (event, ui) {
        var tr = parseInt($('#slider-ranged-target-rating').val()),
            i = 1;

        for (; i < 5; i++) {
          if (i <= tr) {
            $('#div-ranged-target-'+i).slideDown();
          }
          else {
            $('#div-ranged-target-'+i).slideUp();
          }
        }
      },
      onClearLog: function () {
        var rl = $('#list-resultlog');

        logCounter = 1;
        rl.empty();
        rl.append('<li><h3>-- LOG START --</h3></li>');
        rl.listview('refresh');
      },
      onRollAfterBattle: function () {
        var rep = parseInt($('#slider-afterb-rep').val()),
            status = ($('input[name=radio-afterb-status]:checked').val() ==='oof'),
            msg = '';

        if (CR15Rolls.afterBattleRecovery(rep, status)) {
          msg = 'Unit returns to band.';
        }
        else {
          msg = 'Unit does not return.';
        }

        CR15Controller.logMessage('After the Battle Recovery', msg);
      },
      onRollChallenge: function () {
        var rep = parseInt($('#slider-challenge-rep').val()),
            diff = $('input[name=radio-challenge-diff]:checked').val(),
            tool = $('input[name=check-challenge-tool]').is(':checked'),
            retry = $('input[name=check-challenge-retry]').is(':checked'),
            passed = 0,
            msg = '';

        passed = CR15Rolls.challengeTest(rep, diff, tool, retry);
        if (passed === CR15Rolls.CHALLENGE_RESULT.SUCCESS) {
          msg = 'Challenge successful.';
        }
        else if (passed === CR15Rolls.CHALLENGE_RESULT.ABORTED) {
          msg = 'Challenge aborted. Cannot retry.';
        }
        else {
          msg = 'Challenge failed.';
        }

        CR15Controller.logMessage('Challenge test', msg);
      },
      onRollCharge: function () {
        var repA = parseInt($('#slider-charge-rep-charger').val()),
            repB = parseInt($('#slider-charge-rep-target').val()),
            cover = $('input[name=check-charge-cover]').is(':checked'),
            chargeDir = $('input[name=radio-charge-dir]:checked').val(),
            result = 0,
            msg = '';

        result = CR15Rolls.chargeTest(repA, repB, cover, chargeDir);
        if (result > 0) {
          msg = 'Target may not fire.<br>Charger moves into melee.<br>No reaction tests taken.';
        }
        else if (result < 0) {
          msg = 'Target fires.<br>Charger moves into melee.<br>No reaction tests taken.';
        }
        else {
          msg = 'Target rush shots.<br>Charger moves into melee.<br>No reaction tests taken.';
        }

        CR15Controller.logMessage('Charge test', msg);
      },
      onRollInsight: function () {
        var poolA = parseInt($('#slider-insight-rep-a').val()),
            concealA = $('input[name=check-insight-conceal-a]').is(':checked'),
            poolB = parseInt($('#slider-insight-rep-b').val()),
            concealB = $('input[name=check-insight-conceal-b]').is(':checked'),
            result = 0,
            msg = '';

        result = CR15Rolls.inSightTest(poolA, concealA, poolB, concealB);
        msg = (result)?'Active side wins.':'Reacting side wins.';
        CR15Controller.logMessage('In Sight', msg);
      },
      onRollInitiative: function () {
        var rolls = [],
            msg = '';

        rolls = CR15Rolls.initiativeTest(2);

        if (rolls[0] > rolls[1]) {
          msg = 'Player goes first: ' + rolls[0].toString() + ' vs. ' + rolls[1].toString() + '.';
        }
        else if (rolls[1] > rolls[0]) {
          msg = 'Enemy goes first: ' + rolls[0].toString() + ' vs. ' + rolls[1].toString() + '.';
        }
        else {
          msg = 'Doubles (' + rolls[0].toString() + ').';
        }

        CR15Controller.logMessage('Initiative', msg);
      },
      onRollMelee: function () {
        var repAttacker = parseInt($('#slider-melee-rep-a').val()),
            weaponAttacker = $('input[name=radio-melee-weapon-a]:checked').val(),
            proneAttacker = $('input[name=check-melee-prone-a]').is(':checked'),
            repDefender = parseInt($('#slider-melee-rep-b').val()),
            weaponDefender = $('input[name=radio-melee-weapon-b]:checked').val(),
            proneDefender = $('input[name=check-melee-prone-b]').is(':checked'),
            result = 0,
            msg = '';

        result = CR15Rolls.meleeCombat({rep: repAttacker, weapon: weaponAttacker, prone: proneAttacker},
                  {rep: repDefender, weapon: weaponDefender, prone: proneDefender});

        if (result === CR15Rolls.MELEE_RESULT.DEFENDER_OD) {
          msg = 'Attacker hits.<br>Defender obviously dead.';
        }
        else if (result === CR15Rolls.MELEE_RESULT.DEFENDER_OOF) {
          msg = 'Attacker hits.<br>Defender out of the fight.';
        }
        else if (result === CR15Rolls.MELEE_RESULT.DEFENDER_REDUCE_REP) {
          msg = 'Attacker hits.<br>Defender -1 to Rep.<br>Fight again.';
        }
        else if (result === CR15Rolls.MELEE_RESULT.ATTACKER_OD) {
          msg = 'Defender hits.<br>Attacker obviously dead.';
        }
        else if (result === CR15Rolls.MELEE_RESULT.ATTACKER_OOF) {
          msg = 'Defender hits.<br>Attacker out of the fight.';
        }
        else {
          msg = 'Defender hits.<br>Attacker -1 to Rep.<br>Fight again.';
        }

        CR15Controller.logMessage('Melee combat', msg);
      },
      onRollRanged: function () {
        var shooterRep = parseInt($('#slider-ranged-rep-shooter').val()),
            shooterRush = $('input[name=check-ranged-shooter-rush]').is(':checked'),
            shooterFast = $('input[name=check-ranged-shooter-fast]').is(':checked'),
            weaponName = $('#select-ranged-weapon').val(),
            TR = 0,
            dice = 0,
            targets = [],
            result = [],
            i = 0,
            msg = '';

        for (; i < CR15Rolls.WEAPONS_TABLE.length; i++) {
          if (weaponName === CR15Rolls.WEAPONS_TABLE[i].name) {
            TR = CR15Rolls.WEAPONS_TABLE[i].TR;
            dice = CR15Rolls.WEAPONS_TABLE[i].dice;
            break;
          }
        }            

        for (i = 1; i <= TR; i++) {
          targets.push({rep: parseInt($('#slider-ranged-rep-target-'+i).val()),
            prone: $('input[name=check-ranged-prone-'+i+']').is(':checked'),
            cover: $('input[name=check-ranged-cover-'+i+']').is(':checked'),
            fast: $('input[name=check-ranged-fast-'+i+']').is(':checked')});
        }

        results = CR15Rolls.rangedCombat({rep: shooterRep, rush: shooterRush, fast: shooterFast}, TR, dice, targets);
        for (i = 0; i < TR; i++) {
          msg += 'Target ' + (i+1).toString();
          if (results[i] === CR15Rolls.RANGED_RESULT.TARGET_MISSED) {
            msg += ' missed.';
          }
          else if (results[i] === CR15Rolls.RANGED_RESULT.TARGET_DUCK_BACK) {
            msg += ' hit (Duck back)';
          }
          else if (results[i] === CR15Rolls.RANGED_RESULT.TARGET_OOF) {
            msg += ' hit (OOF)';
          }
          else {
            msg += ' hit (OD)';
          }
          if (i < TR-1) {
            msg += '<br>';
          }
        }
        CR15Controller.logMessage('Ranged combat', msg);
      },
      onRollManDown: function () {
        var cover = $('input[name=check-mand-cover]').is(':checked'),
            manyDead = $('input[name=check-mand-dead]').is(':checked'),
            results = [],
            msg = '';

        results = CR15Rolls.manDown(cover, manyDead);
        msg  = 'Rep ' + results[0].toString() + '+: Carry on.';
        if (results[1] > 0 && results[1] < results[0]) {
          if (results[0]-results[1] > 1) {
            msg = msg + '<br>Rep ' + (results[0]-1).toString() + '-' + results[1].toString() + ': ';
          }
          else {
            msg = msg + '<br>Rep ' + results[1].toString() + ': ';
          }
          msg += 'Duck back.'
        }
        if (results[2] > 0) {
          msg = msg + '<br>Lower Rep: Leave the battlefield.';
        }

        CR15Controller.logMessage('Man Down', msg);
      },
      onRollReceivedFire: function () {
        var leaderRep = parseInt($('#slider-recvf-leader').val()),
            results = [],
            msg = '';

        results = CR15Rolls.receivedFire(leaderRep);
        msg  = 'Rep ' + results[0].toString() + '+: Return fire / Duck back.';
        if (results[1] < results[0]) {
          if (results[0] - results[1] > 1) {
            msg = msg + '<br>Rep ' + (results[0]-1).toString() + '-' + results[1].toString() + ': ';
          }
          else {
            msg = msg + '<br>Rep ' + results[1].toString() + ': ';
          }
          msg += 'Rush shot / Duck back.';
        }
        if (results[2] > 0) {
          msg = msg + '<br>Lower Rep: Duck back / Leave the battlefield.';
        }

        CR15Controller.logMessage('Received Fire', msg);
      },
      onRollStarPower: function () {
        var dice = parseInt($('#slider-star-power').val()),
            results = {},
            msg = '';

        results = CR15Rolls.starPower(dice);

        if (results.successes > 0) {
          msg += results.successes.toString() + ' successes.';
        }
        else {
          msg += 'No successes.';
        }

        if (results.lost > 0) {
          msg += '<br>' + results.lost.toString() + ' dice lost.';
        }

        CR15Controller.logMessage('Star Power', msg);
      },
      onNPMovement: function () {
        var NPRep = parseInt($('#slider-npmove-rep').val()),
            outnumber = $('input[name=check-npmove-outn]').is(':checked'),
            result = 0,
            msg = '';

        result = CR15Rolls.NPMovement(NPRep, outnumber);
        if (result === CR15Rolls.NP_MOVEMENT.SPLIT_ENCIRCLE_RIGHT) {
          msg = 'Split into 2 groups of equal size. One group moves to cover and fires at closest player group. The other encircles right staying in cover if possible.';
        }
        else if (result === CR15Rolls.NP_MOVEMENT.SPLIT_ENCIRCLE_LEFT) {
          msg = 'Split into 2 groups of equal size. One group moves to cover and fires at closest player group. The other encircles left staying in cover if possible.';
        }
        else if (result === CR15Rolls.NP_MOVEMENT.MOVE_TO_COVER) {
          msg = 'Move to cover that allows firing at closest player group.';
        }
        else if (result === CR15Rolls.NP_MOVEMENT.REMAIN_IN_COVER) {
          msg = 'Remain in cover or move to nearest cover. May fire at player group if in range after reaching cover.';
        }
        
        CR15Controller.logMessage('NP Movement', msg);
      },
      onPEFMovement: function () {
        var result = CR15Rolls.PEFMovement(),
            msg = '';

        if (result === CR15Rolls.PEF_MOVEMENT.MOVE_8) {
          msg = 'PEF moves 8" directly towards the player ending in cover if possible.'; 
        }
        else if (result === CR15Rolls.PEF_MOVEMENT.MOVE_4) {
          msg = 'PEF moves 4" directly towards the player ending in cover if possible.'; 
        }
        else if (result === CR15Rolls.PEF_MOVEMENT.DONT_MOVE) {
          msg = 'PEF does not move.';
        }

        CR15Controller.logMessage('PEF Movement', msg);
      },
      onPEFResolution: function () {
        var groupSize = parseInt($('#slider-pefres-group').val()),
            something = $('input[name=check-pefres-some]').is(':checked'),
            last = $('input[name=check-pefres-last]').is(':checked'),
            result, 
            msg = '';

        result = CR15Rolls.PEFResolution(groupSize, something, last);
        if (result.result === CR15Rolls.PEF_RESULT.CONTACT) {
          msg = 'Contact! You have run into ' + result.size.toString() + ' enemies.';
        }
        else if (result.result === CR15Rolls.PEF_RESULT.SOMETHING) {
          msg = 'Something is out there! Resolve next PEF with 3d6.';
        }
        else {
          msg = 'False alarm! Just a case of nerves.';
        }
        CR15Controller.logMessage('PEF Resolution', msg);
      },
      onRecruit: function() {
        var groupType = $('#select-recruit-type').val(),
            groupSize = parseInt($('#slider-recruit-size').val()),
            rt = [],
            result = [],
            i = 0,
            msg = '';

        for (; i < CR15Rolls.RECRUITING_TABLE.length; i++) {
          if (groupType === CR15Rolls.RECRUITING_TABLE[i].name) {
            rt = CR15Rolls.RECRUITING_TABLE[i].tb;
            break;
          }
        }
        result = CR15Rolls.recruit(rt, groupSize);
        for (i = 0; i < groupSize; i++) {
          msg = msg + groupType + ' #' + (i+1).toString() + ': Rep ' + result[i].toString();
          if (i < groupSize-1) {
            msg += '<br>';
          }
        }
        CR15Controller.logMessage('Recruitment', msg);
      }
    };
  })();

  // expose our module to the global object
  global.CR15Controller = CR15Controller;

})( this );
