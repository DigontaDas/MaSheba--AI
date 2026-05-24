import { Alert, Linking } from "react-native";

export async function callPhoneNumber(number: string) {
  try {
    const supported = await Linking.canOpenURL(`tel:${number}`);
    if (!supported) {
      throw new Error("Phone calls are not supported on this device");
    }
    await Linking.openURL(`tel:${number}`);
  } catch {
    Alert.alert("কল করা যায়নি", "ফোন অ্যাপ খুলতে সমস্যা হয়েছে।", [{ text: "ঠিক আছে" }]);
  }
}
