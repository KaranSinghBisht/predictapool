// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";

import {PredictaPoolHook} from "../src/PredictaPoolHook.sol";

/// @notice Step 2: Resolve the demo event (run AFTER the 10-minute deadline passes).
///         Then wait 1 hour for settlement delay, and run DemoSettleClaim.s.sol.
contract DemoResolveEvent is Script {
    address constant HOOK = 0xcc42190a78f66BEc53F4E7Da81Ed4aA857628A40;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        PredictaPoolHook hook = PredictaPoolHook(HOOK);
        bytes32 demoEventId = keccak256("DEMO_RESOLVED_EVENT");

        vm.startBroadcast(deployerKey);

        hook.resolveEvent(demoEventId, 0);
        console.log("Resolved: France wins (outcome 0)");

        vm.stopBroadcast();

        console.log("Next: wait 1 hour for settlement delay, then run DemoSettleClaim.s.sol");
    }
}
