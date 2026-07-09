package com.satyaki.escaperoom.systems;

import java.util.HashSet;
import java.util.Set;

public class WardenPhaseManager {

    public enum Phase {
        P75, P50, P25
    }

    private static final Set<Phase> triggered = new HashSet<>();

    public static boolean isTriggered(Phase phase) {
        return triggered.contains(phase);
    }

    public static void markTriggered(Phase phase) {
        triggered.add(phase);
    }

    public static void reset() {
        triggered.clear();
    }
}