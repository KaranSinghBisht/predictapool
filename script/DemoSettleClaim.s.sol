// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";

import {PredictaPoolHook} from "../src/PredictaPoolHook.sol";

/// @notice Step 3: Settle and claim the demo event.
///         Run AFTER 1 hour has passed since DemoResolveEvent.
contract DemoSettleClaim is Script {
    address constant HOOK = 0xcc42190a78f66BEc53F4E7Da81Ed4aA857628A40;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        PredictaPoolHook hook = PredictaPoolHook(HOOK);
        bytes32 demoEventId = keccak256("DEMO_RESOLVED_EVENT");

        vm.startBroadcast(deployerKey);

        hook.settleEvent(demoEventId);
        console.log("Settled event");

        hook.claim(demoEventId);
        console.log("Claimed payout");

        vm.stopBroadcast();

        (,,,,,,, uint256 dep0, uint256 dep1, uint256 ret0, uint256 ret1,) = hook.getEvent(demoEventId);
        console.log("Deposits:", dep0, dep1);
        console.log("Returns:", ret0, ret1);
        console.log("Full lifecycle complete! Judges can verify on-chain.");
    }
}
