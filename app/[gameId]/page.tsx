export default function Page({ params }: { params: { gameId: string } }) {
    return <div>My Post: {params.gameId}</div>
  }