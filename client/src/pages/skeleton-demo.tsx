import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  SkeletonLoader, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonList 
} from "@/components/ui/skeleton-loader";

export default function SkeletonDemo() {
  const [animated, setAnimated] = useState(true);
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("1rem");
  const [count, setCount] = useState(3);
  const [circle, setCircle] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          SkeletonLoader Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Herbruikbare skeleton loading component met shimmer animatie
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Configuratie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Breedte</Label>
              <Input
                id="width"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="100% of 200px"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Hoogte</Label>
              <Input
                id="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="1rem of 20px"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">Aantal</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="10"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="animated"
                  checked={animated}
                  onCheckedChange={setAnimated}
                />
                <Label htmlFor="animated">Animatie</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="circle"
                  checked={circle}
                  onCheckedChange={setCircle}
                />
                <Label htmlFor="circle">Cirkel</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>Basis SkeletonLoader</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonLoader
            width={width}
            height={height}
            count={count}
            circle={circle}
            animated={animated}
          />
        </CardContent>
      </Card>

      {/* Convenience Components */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SkeletonText</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonText lines={4} animated={animated} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SkeletonCard met Avatar</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonCard showAvatar animated={animated} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SkeletonTable</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={5} columns={4} animated={animated} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SkeletonList met Iconen</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonList items={6} showIcon animated={animated} />
        </CardContent>
      </Card>

      {/* Real World Examples */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Kandidaten Lijst Loading</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <SkeletonLoader circle width={48} height={48} animated={animated} />
                <div className="flex-1 space-y-2">
                  <SkeletonLoader height="1.25rem" width="60%" animated={animated} />
                  <SkeletonLoader height="0.875rem" width="40%" animated={animated} />
                  <div className="flex space-x-2">
                    <SkeletonLoader height="1.5rem" width="4rem" animated={animated} />
                    <SkeletonLoader height="1.5rem" width="3rem" animated={animated} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard Stats Loading</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-2">
                  <SkeletonLoader height="0.75rem" width="50%" animated={animated} />
                  <SkeletonLoader height="2rem" width="70%" animated={animated} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accessibility Info */}
      <Card>
        <CardHeader>
          <CardTitle>Toegankelijkheid Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <ul className="space-y-2 text-sm">
              <li>• <strong>ARIA labels:</strong> Automatische "Loading..." labels voor screen readers</li>
              <li>• <strong>Role="status":</strong> Geeft aan dat content aan het laden is</li>
              <li>• <strong>Responsive design:</strong> Past zich aan verschillende schermgroottes aan</li>
              <li>• <strong>Dark mode support:</strong> Verschillende kleuren voor lichte en donkere thema's</li>
              <li>• <strong>Performance:</strong> CSS-only animaties voor optimale prestaties</li>
              <li>• <strong>Flexibele props:</strong> Width, height, count, circle, animated configureerbaar</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Gebruik Voorbeelden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Basis gebruik:</h4>
              <code className="text-sm">
                {`<SkeletonLoader width="200px" height="1rem" count={3} />`}
              </code>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Avatar placeholder:</h4>
              <code className="text-sm">
                {`<SkeletonLoader circle width={40} height={40} />`}
              </code>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Tekst lijnen:</h4>
              <code className="text-sm">
                {`<SkeletonText lines={3} />`}
              </code>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Tabel loading:</h4>
              <code className="text-sm">
                {`<SkeletonTable rows={5} columns={4} />`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}