import Icon, { type IconName } from "../Icon/Icon";
import styles from "./Button.module.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Primary (saffron) once per screen; on-vibe on a vibe field; quiet everywhere else. */
  variant?: "primary" | "quiet" | "on-vibe";
  size?: "md" | "lg";
  icon?: IconName;
}

export default function Button({
  variant = "quiet",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ")}
      {...rest}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}
