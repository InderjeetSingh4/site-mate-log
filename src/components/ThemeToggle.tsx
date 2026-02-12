import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { motion } from "framer-motion";

const ThemeToggle = () => {
  const { theme, toggle } = useTheme();

  return (
    <motion.div whileTap={{ scale: 0.9 }}>
      <Button variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground hover:text-foreground rounded-full">
        {theme === "dark" ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
      </Button>
    </motion.div>
  );
};

export default ThemeToggle;