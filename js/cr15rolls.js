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
  var CR15Rolls = (function() {

    return {
      WEAPONS_TABLE: [ {name: 'Assault Rifle', TR: 3, dice: 3},
        {name: 'Bolt-action Rifle', TR: 1, dice: 1},
        {name: 'Machine Pistol', TR: 3, dice: 3},
        {name: 'Pistol', TR: 1, dice: 1},
        {name: 'Semi-auto Rifle', TR: 2, dice: 2},
        {name: 'Shotgun', TR: 3, dice: 6},
        {name: 'Squad Auto Weapon', TR: 4, dice: 4},
        {name: 'Submachine Gun', TR: 3, dice: 3}
      ],
      RECRUITING_TABLE: [ {name: 'Ganger', tb: [3, 3, 4, 4, 4, 5]},
        {name: 'Guerilla', tb: [3, 3, 4, 4, 4, 5]},
        {name: 'Militia', tb: [3, 3, 4, 4, 4, 5]},
        {name: 'Military', tb: [3, 4, 4, 4, 5, 5]},
        {name: 'Police', tb: [3, 4, 4, 4, 4, 5]}
      ],
      CHALLENGE_RESULT: {SUCCESS: 2,
        ABORTED: 1,
        FAILED: 0 
      },
      MELEE_RESULT: { DEFENDER_REDUCE_REP: 0,
        DEFENDER_OOF: 1,
        DEFENDER_OD: 2,
        ATTACKER_REDUCE_REP: 3,
        ATTACKER_OOF: 4,
        ATTACKER_OD: 5
      },
      RANGED_RESULT: { TARGET_MISSED: 0,
        TARGET_DUCK_BACK: 1,
        TARGET_OOF: 2,
        TARGET_OD: 3
      },
      NP_MOVEMENT: { REMAIN_IN_COVER: 0,
        MOVE_TO_COVER: 1,
        SPLIT_ENCIRCLE_LEFT: 2,
        SPLIT_ENCIRCLE_RIGHT: 3,
      },
      PEF_MOVEMENT: { DONT_MOVE: 0,
        MOVE_4: 1,
        MOVE_8: 2
      },
      PEF_RESULT: { FALSE_ALARM: 0,
        SOMETHING: 1,
        CONTACT: 2
      },
      // Rolls a number of six-side dice.
      // Return: array of dice rolls.
      roll: function(num) {
        var res = [],
            ctr = 0;

        for (; ctr < num; ctr++) {
          res.push(Math.floor(Math.random()*6.0)+1);
        }

        return res;
      },
      // Rolls a single die.
      // Return: number rolled.
      roll1: function() {
        return (Math.floor(Math.random()*6.0)+1);
      },
      // Makes a test of Passing Dice per Chain Reaction rules.
      // Return: number of passed dice.
      rollRep: function(rep, dice) {
        var rolls = CR15Rolls.roll(dice),
            passed = 0,
            ctr = 0;

        for (; ctr < 2; ctr++) {
          if (rolls[ctr] <= rep) {
            passed++;
          }
        }
        return passed;
      },
      // Makes a test of Success Dice per Chain Reaction rules.
      // Return: number of successes rolled.
      rollSuccess: function(dice) {
        var rolls = CR15Rolls.roll(dice),
            success = 0,
            ctr = 0;

        for (; ctr < dice; ctr++) {
          if (rolls[ctr] < 4) {
            success++;
          }
        }
        return success;
      },
      // Makes a test of After the Battle Recovery.
      // oof: true = out of the fight / false = left the battlefield
      // Return: true if unit returns after battle.
      afterBattleRecovery: function(rep, oof) {
        var passed = CR15Rolls.rollRep(rep);

        return (passed === 2 || (passed === 1 && oof));
      },
      // Makes a Challenge Test.
      // diff in {'easy', 'normal', 'hard'}
      // Return: CHALLENGE_RESULT.
      challengeTest: function(rep, diff, tool, retry) {
        var retOptions = [CR15Rolls.CHALLENGE_RESULT.FAILED,
          CR15Rolls.CHALLENGE_RESULT.ABORTED,
          CR15Rolls.CHALLENGE_RESULT.SUCCESS],
            passed = 0;

        if (diff === 'easy') {
          rep++;
        }
        else if (diff === 'hard') {
          rep--;
        }
        if (tool == true) {
          rep++;
        }
        if (rep > 5) {
          rep = 5;
        }
        passed = CR15Rolls.rollRep(rep);
        if (passed === 1 && retry) {
          passed = CR15Rolls.rollRep(rep);
          if (passed === 1) {
            passed = 0;
          }
        }
        return retOptions[passed];
      },
      // Makes a Charge Test.
      // chargeDir in {'front', 'rear', 'flank'}
      // Return: difference between passed dice (Charger - Target).
      chargeTest: function(repCharger, repTarget, cover, chargeDir) {
        var dA = 2,
            dB = 2,
            passedCharger = 0,
            passedTarget = 0,
            rolls = [],
            i = 0;

        if (cover) {
          dB++;
        }
        if (chargeDir == 'flank') {
          dB -= 1;
        }
        else if (chargeDir == 'rear') {
          dB -= 2;
        }
        passedCharger = CR15Rolls.rollRep(repCharger, dA);
        passedTarget = CR15Rolls.rollRep(repTarget, dB);
        return (passedCharger - passedTarget);
      },
      // Makes an In Sight Test.
      // Return: true if the active side is wins the test, false otherwise.
      inSightTest: function(activeRep, activeConcealed, reactingRep, reactingConcealed) {
        var successA = 0,
            successB = 0;

        if (activeConcealed) {
          reactingRep--;
        }
        if (reactingConcealed) {
          activeRep--;
        }
        successA = CR15Rolls.rollSuccess(activeRep);
        successB = CR15Rolls.rollSuccess(reactingRep);
        return (successA > successB);
      },
      // Makes an Initiative Test.
      // Return: array containing the rolled dice for each side (because sometimes the rolled values matter.)
      initiativeTest: function() {
        var rolls = CR15Rolls.roll(2);

        return rolls;
      },
      // Helper function to determine damage of a melee attack.
      meleeDamage: function(bonus, targetRep) {
        var damage = CR15Rolls.roll1() + bonus;
        if (damage >= 6) {
          // OD
          return 2;
        }
        else if (damage >= targetRep) {
          // OOF
          return 1;
        }
        else {
          // -1 to Rep
          return 0;
        }
      },
      // Makes a round of melee combat.
      // attackerData and defenderData are data objects like this: {rep: 4, weapon: '1hand', prone: false}
      // weapon is one of '1hand', '2hand', 'none'
      // Return: MELEE_RESULT.
      meleeCombat: function(attackerData, defenderData) {
        var retOptions = [CR15Rolls.MELEE_RESULT.DEFENDER_REDUCE_REP,
          CR15Rolls.MELEE_RESULT.DEFENDER_OOF,
          CR15Rolls.MELEE_RESULT.DEFENDER_OD,
          CR15Rolls.MELEE_RESULT.ATTACKER_REDUCE_REP,
          CR15Rolls.MELEE_RESULT.ATTACKER_OOF,
          CR15Rolls.MELEE_RESULT.ATTACKER_OD],
            poolAttacker = attackerData.rep,
            poolDefender = defenderData.rep,
            successAttacker = 0,
            successDefender = 0,
            result = 0;

        if (attackerData.weapon === '1hand') {
          poolAttacker += 1;
        }
        else if (attackerData.weapon === '2hand') {
          poolAttacker += 2;
        }

        if (defenderData.prone) {
          poolAttacker += 1;
        }

        if (defenderData.weapon === '1hand') {
          poolDefender += 1;
        }
        else if (defenderData.weapon === '2hand') {
          poolDefender += 2;
        }

        if (attackerData.prone) {
          poolDefender += 1;
        }
        do {
          successAttacker = CR15Rolls.rollSuccess(poolAttacker);
          successDefender = CR15Rolls.rollSuccess(poolDefender);
        } while (successAttacker === successDefender);

        if (successAttacker > successDefender) {
          result = retOptions[CR15Rolls.meleeDamage(successAttacker - successDefender, defenderData.rep)];
        }
        else {
          result = retOptions[3+CR15Rolls.meleeDamage(successDefender - successAttacker, attackerData.rep)];
        }
        return result;
      },
      // Helper function to determine damage of a ranged attack.
      rangedDamage: function(targetRep) {
        var r = CR15Rolls.roll1();

        if (r == 6) {
          // OD
          return CR15Rolls.RANGED_RESULT.TARGET_OD;
        }
        else if (r >= targetRep) {
          // OOF
          return CR15Rolls.RANGED_RESULT.TARGET_OOF;
        }
        // Duck Back
        return CR15Rolls.RANGED_RESULT.TARGET_DUCK_BACK;
      },
      // Makes a set of ranged attacks.
      // shooterData is a data object like this: {rep: 4, rush: false, fast: false}
      // Return: array of RANGED_RESULT.
      rangedCombat: function(shooterData, TR, dice, targetData) {
        var rolls = CR15Rolls.roll(dice).sort(function (a, b) { return b - a; }),
            i = 0,
            results = [];

        for (; i < TR; i++) {
          shot = rolls[i] + shooterData.rep;
          if  ((shot >= 10) ||
          (shot == 9 && !shooterData.fast && !shooterData.rush && !targetData[i].cover && (i<2)) ||
          (shot == 8 && !shooterData.fast && !shooterData.rush && !targetData[i].prone && !targetData[i].cover && !targetData[i].fast && (i<1))) {
            results.push(CR15Rolls.rangedDamage(targetData[i].rep));
          }
          else {
            results.push(CR15Rolls.RANGED_RESULT.TARGET_MISSED);
          }
        }
        return results;
      },
      // Makes a Man Down reaction test.
      // Return: minimum rep for Carry On, Duck Back and Leave Battlefield.
      manDown: function(cover, manyDead) {
        var dice = (cover)?3:2,
            rolls = CR15Rolls.roll(dice).sort(function (a, b) { return a-b; }),
            minr = rolls[0],
            maxr = rolls[1],
            results = [maxr, 0, 0];

        if (!manyDead) {
          results[1] = minr;
        }
        if (minr > 1) {
          results[2] = minr - 1;
        }
        return results;
      },
      // Makes a Received Fire reaction test.
      // Return: minimum rep for Carry On, Duck Back and Leave Battlefield.
      receivedFire: function(leaderRep) {
        var rolls = CR15Rolls.roll(2).sort(function (a, b) { return a - b; }),
            minr = rolls[0],
            maxr = rolls[1],
            results = [maxr, 0, 0];

        /* If the leader die is successful, all units pass 1 extra die.
        Thus, all units will pass at least one die, which is the same
        as setting the low die to 1. */
        if (CR15Rolls.roll1() <= leaderRep) {
          minr = 1;
        }
        results[1] = minr;
        if (minr > 1) {
          results[2] = minr - 1;
        }
        return results;
      },
      // Makes a Star Power test.
      // Return: data object containing successes and lost dice.
      starPower: function(dice) {
        var rolls = CR15Rolls.roll(dice),
            success = 0,
            lostDice = 0,
            i = 0,
            msg = '';

        for (; i < dice; i++) {
          if (rolls[i] < 4) {
            success++;
          }
          else if (rolls[i] === 6) {
            lostDice++;
          }
        }
        return {successes: success, lost: lostDice};
      },
      // Makes a NP Movement test
      // Return: NP_MOVEMENT
      NPMovement: function(rep, outnumber) {
        var result = CR15Rolls.rollRep(rep, 2);
        if (result === 2) {
          if (outnumber) {
            if (CR15Rolls.roll1() < 4) {
              return CR15Rolls.NP_MOVEMENT.SPLIT_ENCIRCLE_LEFT;
            }
            else {
              return CR15Rolls.NP_MOVEMENT.SPLIT_ENCIRCLE_RIGHT;
            }
          }
          else {
            return CR15Rolls.NP_MOVEMENT.MOVE_TO_COVER;
          }
        }
        else if (result === 1) {
          if (outnumber) {
            return CR15Rolls.NP_MOVEMENT.MOVE_TO_COVER;
          }
          else {
            return CR15Rolls.NP_MOVEMENT.REMAIN_IN_COVER;
          }
        }
        else {
          return CR15Rolls.NP_MOVEMENT.REMAIN_IN_COVER;
        }
      },
      // Makes a PEF Movement test
      // Return: PEF_MOVEMENT
      PEFMovement: function() {
        var result = CR15Rolls.rollRep(4, 2);
        
        if (result === 2) {
          return CR15Rolls.PEF_MOVEMENT.MOVE_8;
        }
        else if (result === 1) {
          return CR15Rolls.PEF_MOVEMENT.MOVE_4;
        }
        else {
          return CR15Rolls.PEF_MOVEMENT.DONT_MOVE;
        }
      },
      // Makes a PEF Resolution test
      // Return: data object with PEF_RESULT and group size
      PEFResolution: function(groupSize, something, lastPEF) {
        var roll = 0,
          NPsize = 0;
        
        if (something) {
          roll = CR15Rolls.rollRep(4, 3);
        }
        else {
          roll = CR15Rolls.rollRep(4, 2);
        }
        if (roll >= 2 || (roll === 0 && lastPEF)) {
          roll = CR15Rolls.roll1();
          NPsize = groupSize + [-3, -2, -1, 1, 2, 3][roll-1];
          if (NPsize < 1) {
            NPsize = 1;
          }
          return {result: CR15Rolls.PEF_RESULT.CONTACT, size: NPsize};
        }
        else if (roll === 1) {
          return {result: CR15Rolls.PEF_RESULT.SOMETHING, size: 0};
        }
        else {
          return {result: CR15Rolls.PEF_RESULT.FALSE_ALARM, size: 0};
        }
      },
      // Generate a group of recruits based on a REP table
      // Return: array of Reps for the recruits.
      recruit: function(table, size) {
        var result = [],
            i = 0;
            
        for (; i < size; i++) {
          result.push(table[CR15Rolls.roll1()-1]);
        }
        return result;
      }
    };
  })();

  // expose our module to the global object
  global.CR15Rolls = CR15Rolls;

})( this );
