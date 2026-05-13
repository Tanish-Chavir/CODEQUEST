"use client";

import { motion } from "framer-motion";
import { Code, Terminal, User, Link, Mail, ArrowRight } from "lucide-react";

export function ContactFooter() {
  return (
    <section className="pt-32 pb-12 px-6 relative z-20 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/10 blur-[120px] pointer-events-none rounded-t-full" />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Ready to begin your <span className="text-gradient">Quest</span>?</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto font-light">
            Join thousands of developers turning passive watching into active mastery. Create an account and start your first interactive course today.
          </p>

          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4 mb-12">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all"
            />
            <button type="button" className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 neon-glow">
              Join Now <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex justify-center gap-6">
            <SocialIcon icon={<Terminal className="w-5 h-5" />} href="#" />
            <SocialIcon icon={<User className="w-5 h-5" />} href="#" />
            <SocialIcon icon={<Link className="w-5 h-5" />} href="#" />
            <SocialIcon icon={<Mail className="w-5 h-5" />} href="#" />
          </div>
        </motion.div>

        <footer className="mt-20 flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-sm border-t border-white/10 pt-8">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Code className="w-5 h-5 text-primary" />
            <span>CodeQuest Platform</span>
          </div>
          <p>© {new Date().getFullYear()} CodeQuest. Crafted for digital mastery.</p>
        </footer>
      </div>
    </section>
  );
}

function SocialIcon({ icon, href }: { icon: React.ReactNode, href: string }) {
  return (
    <a 
      href={href} 
      className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/10 hover:-translate-y-1 transition-all duration-300"
    >
      {icon}
    </a>
  );
}
