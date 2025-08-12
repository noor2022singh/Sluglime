import { View, Text, StyleSheet, Button } from 'react-native';
import { Link } from 'expo-router';

export default function EditorScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Editor Screen</Text>
             <Link href="/" asChild>
                <Button title="Back to Home" />
             </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
}); 