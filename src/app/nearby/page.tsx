import { MapPin, Search, LayoutGrid, GlassWater, Toilet, Baby, SlidersHorizontal, Star } from 'lucide-react';


import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area"

import { Button } from "@/components/ui/button"


export default function Nearby() {
    return (
        <div className="w-full max-w-full overflow-x-hidden">
            <div className="w-full bg-cyan-600 flex flex-col items-center justify-center gap-4 rounded-b-2xl py-6">
                
                <div className="flex items-center gap-2">
                    <MapPin className="w-10 h-10 text-yellow-500" />
                    <h1 className="text-white text-2xl font-bold">
                        ManaGo!
                    </h1>
                </div>
         
                <InputGroup className="max-w-xs bg-white">
                    <InputGroupInput placeholder="Search..." />
                    <InputGroupAddon>
                        <Search />
                    </InputGroupAddon>
                </InputGroup>
            </div>
           
            <div className="flex flex-col w-full max-w-full p-4">
                <ScrollArea className="w-full rounded-md whitespace-nowrap">
                    <div className="flex flex-row gap-3 p-4">
                        <Button variant="outline" size="lg">
                        <LayoutGrid /> All
                        </Button>

                        <Button variant="outline" size="lg">
                        <GlassWater /> Water Cooler
                        </Button>

                        <Button variant="outline" size="lg">
                        <Toilet /> Toilets with Bidets
                        </Button>

                        <Button variant="outline" size="lg">
                        <Baby /> Nursing Rooms
                        </Button>
                    </div>

                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
                <div className='flex flex-row justify-between p-4'>
                    <h3 className='font-bold'>Nearby You</h3>
                    <Button variant="outline" className='bg-cyan-600 text-white'>
                        <SlidersHorizontal /> Sort
                    </Button>
                </div>
                 {/* Separate this into a separate component */}
                <div className='flex flex-col gap-4 w-full min-w-0'>
                    <div className='flex flex-row gap-4 border-2 border-gray-300 rounded-md p-4 w-full min-w-0'>
                        <img className='w-24 h-24 rounded-sm shrink-0 object-cover' src="/toilet.jpg" alt="Raffles City B1" />
                        <div className='flex flex-col min-w-0 flex-1 gap-2'>
                            <h3 className='font-bold text-lg'>Raffles City Level B1</h3>
                            <div className="flex items-center gap-2">
                            <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                    i < Math.round(4.5)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                />
                                ))}
                            </div>
                            <span className="text-sm text-gray-500">4.5</span>
                            <span className="text-sm text-gray-500">(32 reviews)</span>
                            
                        </div>
                        <div className='flex flex-row flex-wrap gap-2'>
                                <Button variant="outline" className='bg-emerald-700 rounded-full text-white shrink-0'>Bidets</Button>
                                <Button variant="outline" className='bg-emerald-700 rounded-full text-white shrink-0'>Clean</Button>
                                <Button variant="outline" className='bg-emerald-700 rounded-full text-white shrink-0'>PWD Friendly</Button>
                        </div>
                        <Button>Navigate</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>    
    )
}
