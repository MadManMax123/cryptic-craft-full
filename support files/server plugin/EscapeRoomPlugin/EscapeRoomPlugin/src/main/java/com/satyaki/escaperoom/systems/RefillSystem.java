package com.satyaki.escaperoom.systems;

import org.bukkit.*;
import org.bukkit.block.BlockState;
import org.bukkit.block.Container;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.plugin.Plugin;

import java.util.*;

public class RefillSystem {

    private static final Map<Location, ItemStack[]> snapshots = new HashMap<>();

    public static void load(Plugin plugin) {

        FileConfiguration config = plugin.getConfig();

        if (!config.contains("chests")) return;

        for (String key : config.getConfigurationSection("chests").getKeys(false)) {

            String path = "chests." + key;

            World world = Bukkit.getWorld(config.getString(path + ".world"));
            int x = config.getInt(path + ".x");
            int y = config.getInt(path + ".y");
            int z = config.getInt(path + ".z");

            Location loc = new Location(world, x, y, z);

            List<ItemStack> items = (List<ItemStack>) config.getList(path + ".items");

            snapshots.put(loc, items.toArray(new ItemStack[0]));
        }
    }

    public static void saveChest(Plugin plugin, Location loc, Inventory inv) {

        snapshots.put(loc, inv.getContents());

        FileConfiguration config = plugin.getConfig();

        String key = loc.getBlockX() + "_" + loc.getBlockY() + "_" + loc.getBlockZ();
        String path = "chests." + key;

        config.set(path + ".world", loc.getWorld().getName());
        config.set(path + ".x", loc.getBlockX());
        config.set(path + ".y", loc.getBlockY());
        config.set(path + ".z", loc.getBlockZ());
        config.set(path + ".items", Arrays.asList(inv.getContents()));

        plugin.saveConfig();
    }

    public static void start(Plugin plugin) {

        Bukkit.getScheduler().runTaskTimer(plugin, () -> {

            for (Location loc : snapshots.keySet()) {

                BlockState state = loc.getBlock().getState();

                // ✅ ONLY process containers
                if (!(state instanceof Container container)) continue;

                Inventory inv = container.getInventory();

                inv.setContents(snapshots.get(loc));
            }

        }, 0L, 200L); // 10s
    }
}