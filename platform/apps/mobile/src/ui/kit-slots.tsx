import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from './kit-styles';

export function MobileSlotPicker({ slots, selectedId, onSelect }: { slots: { id: string; time: string; available: boolean }[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <View style={styles.slotContainer}>
      {slots.map((slot) => (
        <Pressable
          key={slot.id}
          disabled={!slot.available}
          onPress={() => onSelect(slot.id)}
          style={[styles.slot, selectedId === slot.id && styles.slotSelected, !slot.available && styles.slotDisabled]}
        >
          <Text style={styles.slotText}>{slot.time}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function MobilePriceBreakdown({ items, total }: { items: { label: string; price: number }[]; total: number }) {
  return (
    <View style={styles.priceContainer}>
      {items.map((item, idx) => (
        <View key={idx} style={styles.priceRow}>
          <Text style={styles.priceLabel}>{item.label}</Text>
          <Text style={styles.priceVal}>{item.price} ₴</Text>
        </View>
      ))}
      <View style={[styles.priceRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Всього</Text>
        <Text style={styles.totalVal}>{total} ₴</Text>
      </View>
    </View>
  );
}
