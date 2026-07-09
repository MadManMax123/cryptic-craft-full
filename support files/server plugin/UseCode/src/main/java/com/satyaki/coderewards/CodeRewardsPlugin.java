package com.satyaki.coderewards;

import org.bukkit.plugin.java.JavaPlugin;

public class CodeRewardsPlugin extends JavaPlugin {

    private static CodeRewardsPlugin instance;

    @Override
    public void onEnable() {
        instance = this;

        CodeManager.init(this);

        getCommand("usecode").setExecutor(new UseCodeCommand());
        getServer().getPluginManager().registerEvents(new CodeListener(), this);
        getServer().getPluginManager().registerEvents(new WandListener(), this);

        getLogger().info("CodeRewards enabled!");
    }

    public static CodeRewardsPlugin getInstance() {
        return instance;
    }
}