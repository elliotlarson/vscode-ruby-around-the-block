# Ruby Around the Block

Toggle between multi-line do-end and single line braces blocks.

## Example/Usage

With your cursor on the `let(:bar)` line, use command menu to pick `Ruby Block Toggle`.

```ruby
RSpec.describe(Foo) do
  let(:bar) { create(:bar, name: 'yo') }
end

# becomes
RSpec.describe(Foo) do
  let(:bar) do
    create(:bar, name: 'yo')
  end
end

# and vice versa
```

## Known Issues

This doesn't play well with blocks that have code chained onto it

```ruby
foos.each { |foo| foo.something }.map(&:other_stuff)
```

The `.map(&:other_stuff)` gets removed... working on it.
