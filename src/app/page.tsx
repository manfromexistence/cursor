
import { EmojiTextarea } from '@/components/emoji-typer/emoji-textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-pink-950">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            EmojiTyper ⚡
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Type in the box below and watch GIFs burst from your cursor! The faster you type, the more dynamic the effect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmojiTextarea />
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} EmojiTyper. Experience the joy of typing!</p>
      </footer>
    </main>
  );
}
