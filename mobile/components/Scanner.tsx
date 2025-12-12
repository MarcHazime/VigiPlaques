import { Camera, useCameraDevice, useFrameProcessor, VisionCameraProxy } from 'react-native-vision-camera';
import { StyleSheet, Text, View, TouchableOpacity, Platform, AppState, AppStateStatus } from 'react-native';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Worklets } from 'react-native-worklets-core';

// Remove the import from the library causing issues
// import { useTextRecognition } from 'react-native-vision-camera-ocr-plus';

type ScannerProps = {
    onScan: (plate: string) => void;
    onClose: () => void;
};

const plugin = VisionCameraProxy.initFrameProcessorPlugin('scanText', {
    language: 'latin',
    useLightweightMode: false, // Disable lightweight to improve accuracy
    frameSkipThreshold: 5, // Check more frequently (every 5th frame instead of 15th)
});

console.log('Scan Text Plugin initialized:', plugin); // <--- DEBUG LOG

const RealScanner = ({ onScan, onClose }: ScannerProps) => {
    const device = useCameraDevice('back');
    const [hasPermission, setHasPermission] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string>('');

    // Lifecycle management to prevent "Camera Restricted" errors
    const appState = useRef(AppState.currentState);
    const [isActive, setIsActive] = useState(AppState.currentState === 'active');

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            appState.current = nextAppState;
            setIsActive(nextAppState === 'active');
        });

        return () => {
            subscription.remove();
        };
    }, []);

    // Strict validator for French SIV plates (AA-123-AA)
    const processResult = useCallback((rawText: string) => {
        const lines = rawText.split('\n');

        for (const line of lines) {
            const cleanLine = line.toUpperCase().trim();
            const pure = cleanLine.replace(/[^A-Z0-9]/g, '');

            if (pure.length === 7) {
                const sivRegex = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
                if (sivRegex.test(pure)) {
                    const formatted = `${pure.substring(0, 2)}-${pure.substring(2, 5)}-${pure.substring(5, 7)}`;

                    // AUTO-SCAN Mode (Restored with Calibration)
                    onScan(formatted);
                    return;
                }
            }
        }
    }, [onScan]);

    // Prepare helper to run on JS
    const runScanOnJS = Worklets.createRunOnJS(processResult);
    const runDebugOnJS = Worklets.createRunOnJS(setDebugInfo);

    // Initialize the plugin directly
    // This avoids using the libraries hook which might have bad worklet code


    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        if (!plugin) return;

        try {
            // Call plugin
            // @ts-ignore
            const data = plugin.call(frame);

            // Debug log (will appear in Metro terminal)
            // console.log('Scanner data:', JSON.stringify(data));

            const textData = data as any;
            let fullText = '';
            let debugStr = '';

            let blocksToProcess: any[] = [];

            // Normalize inputs: Plugin can return Array or Single Object
            if (Array.isArray(textData)) blocksToProcess = textData;
            else if (textData?.blocks) blocksToProcess = [textData];
            // else if (textData?.resultText || textData?.text) debugStr = 'No Coord Data'; // Debug info removed

            if (blocksToProcess.length > 0) {
                // PHASE 1: Collect Candidates
                const candidates = blocksToProcess.map((d: any) => {
                    if (!d || !d.blocks || !Array.isArray(d.blocks) || d.blocks.length === 0) return null;

                    const box = d.blocks[0];
                    if (!box) return null;

                    let targetFrame = box.blockFrame || box;
                    let cx = targetFrame.boundingCenterX;
                    let cy = targetFrame.boundingCenterY;

                    if (typeof cx !== 'number' && typeof targetFrame.x === 'number') cx = targetFrame.x + targetFrame.width / 2;
                    if (typeof cy !== 'number' && typeof targetFrame.y === 'number') cy = targetFrame.y + targetFrame.height / 2;

                    if (typeof cx === 'number' && typeof cy === 'number') return { data: d, cx, cy };
                    return null;
                }).filter(c => c !== null);

                // PHASE 2: Filter by ROI & Calculate Distance
                const validCandidates = candidates.map((c: any) => {
                    const { cx, cy, data } = c;
                    const fw = frame.width;
                    const fh = frame.height;

                    // DYNAMIC CENTER: Use the actual center of the camera frame
                    const TARGET_X = fw / 2;
                    const TARGET_Y = fh / 2;

                    // Relaxed Validation: Accept text from mostly anywhere, but prioritize center
                    const TOLERANCE_X = fw * 0.45; // 90% of width
                    const TOLERANCE_Y = fh * 0.45; // 90% of height

                    const minX = TARGET_X - TOLERANCE_X;
                    const maxX = TARGET_X + TOLERANCE_X;
                    const minY = TARGET_Y - TOLERANCE_Y;
                    const maxY = TARGET_Y + TOLERANCE_Y;

                    if (cx < minX || cx > maxX || cy < minY || cy > maxY) return null;

                    // Calculate distance from center for sorting
                    const distSq = Math.pow(cx - TARGET_X, 2) + Math.pow(cy - TARGET_Y, 2);

                    return { ...c, distSq };
                }).filter((c: any) => c !== null);

                // PHASE 3: Sort & Select Winner
                if (validCandidates.length > 0) {
                    // Sort by distance ascending (closest to center first)
                    validCandidates.sort((a: any, b: any) => a.distSq - b.distSq);

                    const winner = validCandidates[0];
                    const d = winner.data;

                    if (d.resultText) fullText = d.resultText;
                    else if (d.text) fullText = d.text;
                    else if (Array.isArray(d.blocks) && d.blocks.length > 0) fullText = d.blocks[0]?.text || d.blocks[0]?.blockText || ""; // Start with first block

                    // Try to stitch blocks if single block is too short? 
                    // For now, let's trust the primary block or resultText

                    console.log(`[Scanner] Candidate found: "${fullText}" at (${winner.cx.toFixed(0)}, ${winner.cy.toFixed(0)})`);
                } else {
                    // console.log(`[Scanner] No valid candidates in ROI (${candidates.length} raw)`);
                }
            }
            // FALLBACK REMOVED: If data is not an array or has no coords, we IGNORE it.
            // This prevents "scanning everything" when the structure is flat.

            // if (debugStr) runDebugOnJS(debugStr); // Debug removed for production

            if (fullText && fullText.length > 2) {
                // Pass RAW text to JS to preserve line structure
                // The cleaning/merging on Worklet side was causing garbage detection
                runScanOnJS(fullText);
            }
        } catch (e) {
            // console.log('Frame error:', e);
        }
    }, [runScanOnJS]); // runDebugOnJS removed from dependencies

    useEffect(() => {
        (async () => {
            const status = await Camera.requestCameraPermission();
            setHasPermission(status === 'granted');
        })();
    }, []);

    if (!device || !hasPermission) {
        return <View style={styles.container}><Text style={{ color: 'white' }}>Camera access required</Text></View>;
    }

    return (
        <View style={styles.container}>
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isActive} // <--- Use dynamic active state
                frameProcessor={frameProcessor}
                pixelFormat="yuv"
            />
            {/* Overlay */}
            <View style={styles.overlay}>
                <View style={styles.scanArea} />
                <Text style={styles.hint}>Placez la plaque dans le cadre</Text>
            </View>

            <TouchableOpacity style={styles.closeFab} onPress={onClose}>
                <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
        </View >
    );
};

export default function Scanner(props: ScannerProps) {
    const isExpoGo = Constants.appOwnership === 'expo';

    // If we are in Expo Go OR if the native modules failed to load
    // We check for Camera and useCameraDevice as indicators that VisionCamera loaded successfully.
    if (isExpoGo || !Camera || !useCameraDevice) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Scanner non supporté sur Expo Go</Text>
                <Text style={styles.subtext}>Veuillez utiliser un "Development Build"</Text>
                <TouchableOpacity onPress={props.onClose} style={styles.closeButton}>
                    <Text style={styles.closeText}>Fermer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return <RealScanner {...props} />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: 'white',
        fontSize: 18,
    },
    subtext: {
        color: '#aaa',
        marginTop: 10,
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#333',
        borderRadius: 5,
    },
    closeText: {
        color: 'white',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanArea: {
        width: 300,
        height: 100,
        borderWidth: 2,
        borderColor: '#007AFF',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 10,
    },
    hint: {
        color: 'white',
        marginTop: 20,
        fontSize: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 5,
        borderRadius: 5,
    },
    closeFab: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
