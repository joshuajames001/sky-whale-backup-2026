import { DiscoveryBook } from '../../types/discovery';

interface DiscoveryCardProps {
    book: DiscoveryBook;
    onClick?: (book: DiscoveryBook) => void;
    index?: number;
}

export const DiscoveryCard = ({ book, onClick }: DiscoveryCardProps) => {
    return (
        <div
            onClick={() => onClick?.(book)}
            className="relative w-full h-full bg-[#1c1917] flex flex-col group cursor-pointer"
        >
            {/* OBRÁZEK: Horní část / Dominanta */}
            <div className="w-full aspect-[4/5] md:aspect-video relative overflow-hidden bg-stone-900">
                <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                />

                {/* Mobile Title Overlay (Reveals on hover/tap) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col items-center justify-end pb-8 px-4 pointer-events-none group-hover:pointer-events-auto">
                    <h3 className="text-sm md:text-xl font-serif text-amber-50 text-center leading-tight uppercase italic tracking-wider drop-shadow-xl line-clamp-2 px-2">
                        {book.title}
                    </h3>
                    <div className="w-10 h-0.5 bg-amber-500/50 mt-2 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </div>

                {/* Papírová textura - overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]" />

                {/* Dekorativní rohy (Vědecký styl) */}
                <div className="absolute top-4 left-4 w-6 h-6 border-l border-t border-white/20" />
                <div className="absolute top-4 right-4 w-6 h-6 border-r border-t border-white/20" />
            </div>

            {/* SPODNÍ ČÁST: Datové řádky na pískovci - Skryto na mobilu, vidět na desktopu */}
            <div className="relative p-4 md:p-8 bg-[#292524] hidden md:block flex-1">
                {/* Textura pískovce na pozadí */}
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/sandpaper.png')] pointer-events-none" />

                <div className="relative z-10 h-full flex flex-col">
                    {/* Velký název jako nadpis protokolu */}
                    <h3 className="text-xl md:text-3xl font-serif text-stone-100 uppercase italic tracking-tighter mb-4 md:mb-6 border-b border-stone-700/50 pb-2 md:pb-4 group-hover:text-amber-100 transition-colors truncate">
                        {book.title}
                    </h3>

                    {/* DATA V ŘÁDCÍCH - čisté a vzdušné */}
                    <div className="grid grid-cols-1 gap-y-1.5 md:gap-y-3 mt-auto">
                        {/* Hidden on mobile to save space and avoid over-cluttering */}
                        <div className="hidden md:flex justify-between items-end border-b border-stone-800/50 pb-1">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold">Vědecké jméno</span>
                            <span className="text-sm text-stone-300 italic font-serif tracking-wide truncate ml-2">{book.species_code}</span>
                        </div>

                        <div className="flex justify-between items-end border-b border-stone-800/50 pb-1">
                            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold">Období</span>
                            <span className="text-xs md:text-sm text-stone-300">{book.period_text}</span>
                        </div>

                        {/* Hidden on mobile to save space */}
                        <div className="hidden md:flex justify-between items-end border-b border-stone-800/50 pb-1">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold">Hlavní lokalita</span>
                            <span className="text-sm text-stone-300">{book.discovery_coords}</span>
                        </div>

                        <div className="flex justify-between items-end border-b border-stone-800/50 md:border-none pb-1 md:pb-0">
                            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold">Hmotnost</span>
                            <span className="text-xs md:text-sm text-stone-300 font-mono tracking-tighter">{book.weight_text}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spodní dekorační linka */}
            <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-stone-700/30 to-transparent" />

            {/* BORDER OVERLAY - Fix pro problikávání rohů */}
            <div className="absolute inset-0 rounded-3xl border border-stone-800 pointer-events-none z-50" />
        </div>
    );
};
