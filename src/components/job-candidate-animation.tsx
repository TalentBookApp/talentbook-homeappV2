import { LayoutGroup, motion } from "motion/react"
import { TextRotate } from "./ui/text-rotate"

export function JobCandidateAnimation() {
  return (
    <LayoutGroup>
      <motion.span className="inline-flex items-baseline" layout>
        <motion.span
          layout
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="mr-4"
        >
          Find a{" "}
        </motion.span>
        <TextRotate
          texts={[
            "job.",
            "candidate.",
            "match.",
            "opportunity.",
            "talent.",
            "role.",
            "hire."
          ]}
          mainClassName="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg inline-flex items-center justify-center min-w-[140px]"
          staggerFrom="last"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-120%", opacity: 0 }}
          staggerDuration={0.03}
          splitLevelClassName=""
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          rotationInterval={3000}
        />
      </motion.span>
    </LayoutGroup>
  )
}