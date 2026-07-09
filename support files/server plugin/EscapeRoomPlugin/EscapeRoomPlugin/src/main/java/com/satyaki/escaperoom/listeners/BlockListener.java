package com.satyaki.escaperoom.listeners;

import org.bukkit.Material;
import org.bukkit.entity.Painting;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.hanging.HangingBreakEvent;

public class BlockListener implements Listener {

    @EventHandler
    public void onPlace(BlockPlaceEvent event) {

        // ✅ OP bypass
        if (event.getPlayer().isOp()) return;

        Material type = event.getBlock().getType();

        // ✅ Allow ONLY these to be placed
        if (type == Material.LEVER || type == Material.TNT) {
            event.setCancelled(false);
            return;
        }

        // ❌ Block everything else
        event.setCancelled(true);
    }

    @EventHandler
    public void onBreak(BlockBreakEvent event) {

        // ✅ OP bypass
        if (event.getPlayer().isOp()) return;

        Material type = event.getBlock().getType();

        // ✅ Only allow breaking levers
        if (type == Material.LEVER) {
            event.setCancelled(false);
            return;
        }

        // ❌ Block breaking everything else
        event.setCancelled(true);
    }

    @EventHandler
    public void onHangingBreak(HangingBreakEvent event) {

        // ❌ Ban breaking paintings BY ANYONE (no OP bypass)
        if (event.getEntity() instanceof Painting) {
            event.setCancelled(true);
        }
    }
}