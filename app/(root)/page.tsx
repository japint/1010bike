import { Button } from "@/components/ui/button";
export const metadata = {
  title: "Home",
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const HomePage = async () => {
  await delay(2000);
  return (
    <main>
      <h1>Welcome to Next.js with shadcn/ui</h1>
      <Button>Button</Button>
    </main>
  );
};

export default HomePage;
