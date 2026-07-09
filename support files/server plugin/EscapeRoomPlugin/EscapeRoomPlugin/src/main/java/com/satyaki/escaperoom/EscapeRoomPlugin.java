package com.satyaki.escaperoom;

import com.satyaki.escaperoom.commands.RefillCommand;
import com.satyaki.escaperoom.commands.BossFightCommand;
import com.satyaki.escaperoom.listeners.*;
import com.satyaki.escaperoom.systems.ItemCleanupTask;
import com.satyaki.escaperoom.systems.LeverDestroyTask;
import com.satyaki.escaperoom.systems.RefillSystem;
import com.satyaki.escaperoom.systems.GameModeEnforcer;
import org.bukkit.plugin.java.JavaPlugin;
public class EscapeRoomPlugin extends JavaPlugin {

    @Override
    public void onEnable() {

        saveDefaultConfig();

        // LISTENERS
        getServer().getPluginManager().registerEvents(new JoinListener(), this);
        getServer().getPluginManager().registerEvents(new BlockListener(), this);
        getServer().getPluginManager().registerEvents(new ExplosionListener(), this);
        getServer().getPluginManager().registerEvents(new MoveListener(), this);
        getServer().getPluginManager().registerEvents(new ChestListener(this), this);
        getServer().getPluginManager().registerEvents(new InteractListener(), this);
        getServer().getPluginManager().registerEvents(new PlaceOverrideListener(), this);
        getServer().getPluginManager().registerEvents(new InventoryListener(), this);
        getServer().getPluginManager().registerEvents(new WardenDeathListener(), this);
        getServer().getPluginManager().registerEvents(new TrapdoorAutoCloseListener(this), this);

        ItemCleanupTask.start(this);

        // COMMANDS
        getCommand("refillwand").setExecutor(new RefillCommand());
        getCommand("bossfight").setExecutor(new BossFightCommand(this));

        // SYSTEMS
        RefillSystem.load(this);
        RefillSystem.start(this);
        GameModeEnforcer.start(this);
        LeverDestroyTask.start(this);

        getLogger().info("EscapeRoomPlugin ENABLED");
    }

    @Override
    public void onDisable() {
        getLogger().info("EscapeRoomPlugin DISABLED");
    }
}