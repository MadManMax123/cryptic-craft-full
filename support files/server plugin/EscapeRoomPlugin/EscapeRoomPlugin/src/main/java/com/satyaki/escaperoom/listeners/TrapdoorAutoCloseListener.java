package com.satyaki.escaperoom.listeners;

import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.block.data.BlockData;
import org.bukkit.block.data.type.TrapDoor;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockPhysicsEvent;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitRunnable;

import java.util.HashSet;
import java.util.Set;

public class TrapdoorAutoCloseListener implements Listener {

    private final Plugin plugin;
    private final Set<Block> scheduled = new HashSet<>();

    public TrapdoorAutoCloseListener(Plugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onPhysics(BlockPhysicsEvent event) {

        Block block = event.getBlock();

        if (!block.getType().name().endsWith("TRAPDOOR")) return;

        BlockData data = block.getBlockData();
        if (!(data instanceof TrapDoor trapdoor)) return;

        // Only trigger when it becomes OPEN
        if (!trapdoor.isOpen()) return;

        // prevent duplicate scheduling
        if (scheduled.contains(block)) return;

        scheduled.add(block);

        new BukkitRunnable() {
            @Override
            public void run() {

                if (block.getType().name().endsWith("TRAPDOOR")) {

                    BlockData newData = block.getBlockData();

                    if (newData instanceof TrapDoor td) {
                        td.setOpen(false);
                        block.setBlockData(td);
                    }
                }

                scheduled.remove(block);
            }
        }.runTaskLater(plugin, 20L * 5); // 7 seconds
    }
}