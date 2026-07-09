package com.satyaki.escaperoom.systems;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.entity.Item;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitRunnable;

public class ItemCleanupTask {

    private static final int X = 742;
    private static final int Y = -27;
    private static final int Z = -1142;

    private static final int RADIUS = 40;

    public static void start(Plugin plugin) {

        new BukkitRunnable() {

            @Override
            public void run() {

                World world = Bukkit.getWorld("world");
                if (world == null) return;

                Location center = new Location(world, X, Y, Z);

                for (Item item : world.getEntitiesByClass(Item.class)) {

                    Location loc = item.getLocation();

                    if (loc.getWorld() != world) continue;

                    if (loc.distanceSquared(center) <= (RADIUS * RADIUS)) {
                        item.remove();
                    }
                }
            }

        }.runTaskTimer(plugin, 0L, 20L * 300); // every 30 seconds
    }
}