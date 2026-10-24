package com.zomatwo.common.enums;

import java.util.Set;

/**
 * Lifecycle states for orders in the Zomatwo platform.
 */
public enum OrderStatus {
    PAYMENT_PENDING,
    CONFIRMED,
    PREPARING,
    READY_FOR_PICKUP,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED,
    REJECTED;

    /**
     * State transition validation helper.
     */
    public boolean canTransitionTo(OrderStatus next) {
        if (this == next) return true;
        return switch (this) {
            case PAYMENT_PENDING -> next == CONFIRMED || next == CANCELLED;
            case CONFIRMED -> next == PREPARING || next == CANCELLED || next == REJECTED;
            case PREPARING -> next == READY_FOR_PICKUP || next == CANCELLED;
            case READY_FOR_PICKUP -> next == OUT_FOR_DELIVERY || next == CANCELLED;
            case OUT_FOR_DELIVERY -> next == DELIVERED || next == CANCELLED;
            case DELIVERED, CANCELLED, REJECTED -> false;
        };
    }
}
