import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export function ResultTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Record<string, unknown>[];
}) {
  if (rows.length === 0) {
    return <Text style={styles.empty}>Query ran successfully but returned no rows.</Text>;
  }

  return (
    <ScrollView horizontal>
      <View>
        <View style={styles.row}>
          {columns.map((column) => (
            <Text key={column} style={[styles.cell, styles.head]}>
              {column}
            </Text>
          ))}
        </View>
        {rows.map((row, index) => (
          <View key={index} style={styles.row}>
            {columns.map((column) => (
              <Text key={column} style={styles.cell}>
                {row[column] === null || row[column] === undefined ? "null" : String(row[column])}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.muted, padding: 12 },
  row: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.border },
  cell: { color: colors.muted, minWidth: 120, paddingHorizontal: 10, paddingVertical: 8 },
  head: { color: colors.text, fontWeight: "700" },
});
