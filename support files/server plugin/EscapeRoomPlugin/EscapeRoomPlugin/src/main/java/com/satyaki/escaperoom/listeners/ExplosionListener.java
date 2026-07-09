package com.satyaki.escaperoom.listeners;

import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.entity.TNTPrimed;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityExplodeEvent;

import java.util.Iterator;

public class ExplosionListener implements Listener {

    @EventHandler
    public void onExplode(EntityExplodeEvent event) {

        Iterator<Block> it = event.blockList().iterator();

        while (it.hasNext()) {
            Block block = it.next();

            // ❌ Prevent ALL block damage EXCEPT TNT
            if (block.getType() != Material.TNT) {
                it.remove();
            }
        }

        // Optional: remove drops
        if (event.getEntity() instanceof TNTPrimed tnt) {
            tnt.setYield(0);
        }
    }
}