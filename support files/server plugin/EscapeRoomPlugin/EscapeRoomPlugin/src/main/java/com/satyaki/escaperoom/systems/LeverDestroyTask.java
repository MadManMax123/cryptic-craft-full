package com.satyaki.escaperoom.systems;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitRunnable;

public class LeverDestroyTask {

    public static void start(Plugin plugin) {

        World world = Bukkit.getWorld("world");
        if (world == null) return;

        Location center = new Location(world, 722, 90, -1178);
        int radius = 5;

        new BukkitRunnable() {

            @Override
            public void run() {

                for (int x = -radius; x <= radius; x++) {
                    for (int y = -radius; y <= radius; y++) {
                        for (int z = -radius; z <= radius; z++) {

                            Location loc = center.clone().add(x, y, z);
                            Block block = world.getBlockAt(loc);

                            if (block.getType() == Material.LEVER) {
                                block.setType(Material.AIR);
                            }
                        }
                    }
                }
            }

        }.runTaskTimer(plugin, 0L, 20L * 10); // 10 seconds
    }
}