import {GestureResponderEvent, Pressable, Text} from "react-native";
import {PropsWithChildren} from "react";
import "@/assets/css/global.css"
import classNames from "classnames";

export const Button = (props: PropsWithChildren<{
    onPress: ((event: GestureResponderEvent) => void) | null | undefined;
    disabled?: boolean;
    className?: string;
}>) => (
    <Pressable onPress={props.onPress} disabled={props.disabled}
               className={classNames(
                   'px-4 py-2 flex items-center justify-center cursor-pointer ',
                   props.disabled ? 'bg-neutral-500 opacity-50 cursor-not-allowed' : 'bg-lime-500 hover:bg-lime-400 active:bg-lime-300',
                   props.className ?? ''
               )}>

        <Text className="text-white text-center font-bold text-md">{props.children}</Text>
    </Pressable>
)